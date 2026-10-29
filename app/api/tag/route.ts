import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { ALL_TAGS } from "@/lib/tags";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const categories = ["Native", "Tops", "Bottoms", "Outerwear", "Shoes", "Accessories", "Fragrance"];
const colours = [
  "Black", "White", "Cream", "Beige", "Navy", "Blue", "Grey", "Brown", "Tan", "Wine",
  "Red", "Orange", "Yellow", "Gold", "Green", "Olive", "Pink", "Purple", "Multicolour",
];
const looks = ["Streetwear", "Casual", "Smart Casual", "Native", "Formal"];
const detailOptions = [
  "Stripes", "Checks", "Print", "Logo", "Embroidery", "Graphic",
  "Lace", "Textured", "Ripped", "Buttons", "Zip",
];

const nameRule = `name is a descriptive title of 3 to 4 words in Title Case: colour first, then the material, pattern or style, then the piece. Always include a material, pattern or style when you can see one. Examples: Black Leather Jacket, Blue Oxford Shirt, Blue Striped Shirt, Wine Embroidered Senator, White Low-Top Sneakers, Tan Suede Loafers.`;

const tagRule = `tags are up to 4 specification tags chosen only from the allowed list. Pick at most one tag per kind.
For tops, jackets and native wear, ALWAYS include the sleeve length (Short Sleeve, Long Sleeve, Sleeveless or Three-Quarter Sleeve), and add the neckline when visible.
For trousers, ALWAYS include the fit.
For shoes, ALWAYS include the shoe style (Low-Top, High-Top, Slip-On or Lace-Up), and add the material when visible.
For watches, belts and jewellery, add the material or finish when visible (Leather, Gold-Tone, Silver-Tone).
Add material and pattern when you can see them. Leave out anything you cannot see clearly.`;

const sizeRule = `size: only if a size label or tag is clearly readable in the photo, return it exactly as printed, for example XL, XXL, M, 42 or 32. Otherwise leave size out. Never guess.`;

const photoPrompt = `You are a menswear stylist in Lagos, Nigeria. Look at this photo from a man's wardrobe.
A matching native set (agbada with buba and sokoto, buba and sokoto, a senator top and trousers, a kaftan set) counts as ONE item, category Native, with a type like Agbada Set, Buba and Sokoto, Senator Set or Kaftan Set.
A fila or native cap is category Accessories.
If a person is wearing the clothes, pick the single most prominent piece (usually the top layer, like a jacket, shirt or native set) and describe only that piece. Set multiple_items to true only when there is no clear main piece, such as several separate items laid out side by side with equal focus. A native set is not multiple items.
type is the plain garment name, for example Jacket, Shirt, Polo, Chinos, Jeans, Agbada Set, Loafers, Sneakers, Watch.
${nameRule}
${tagRule}
${sizeRule}
colour is the main colour. Use Multicolour for prints with no single main colour.
Set is_clothing to false if the photo is not clothing, shoes, an accessory or a fragrance.
Set confident to false if the photo is unclear or you are unsure.`;

function correctionPrompt(current: unknown, note: string) {
  return `A wardrobe item is currently recorded as:
${JSON.stringify(current)}

The owner says: "${note.trim().slice(0, 500)}"

Return ONLY the fields his words change, plus name, description and tags.
Never change type or category unless he clearly names a different kind of garment.
If he mentions a logo, stripes, print, embroidery or similar, return details with the full updated list.
If he mentions a second colour (stripes, logo colour, trim), return accent_colour.
Always return name: the updated title. Keep the current type and any material already in the title unless he changed them. ${nameRule}
Always return tags: the full updated list, keeping current tags he did not contradict and adding anything he mentioned. Only use the allowed list. Do not include size.
Always return description: one short plain sentence describing the item, including every detail he mentioned.`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { image, note, current } = await request.json();
  const isCorrection = typeof note === "string" && note.trim().length > 0;

  const tagsSchema = { type: Type.ARRAY, items: { type: Type.STRING, enum: ALL_TAGS } };

  const schema = isCorrection
    ? {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING, enum: categories },
          type: { type: Type.STRING },
          colour: { type: Type.STRING, enum: colours },
          accent_colour: { type: Type.STRING, enum: [...colours, "None"] },
          details: { type: Type.ARRAY, items: { type: Type.STRING, enum: detailOptions } },
          tags: tagsSchema,
          description: { type: Type.STRING },
        },
        required: ["name", "description", "tags"],
      }
    : {
        type: Type.OBJECT,
        properties: {
          is_clothing: { type: Type.BOOLEAN },
          multiple_items: { type: Type.BOOLEAN },
          name: { type: Type.STRING },
          category: { type: Type.STRING, enum: categories },
          type: { type: Type.STRING },
          colour: { type: Type.STRING, enum: colours },
          looks: { type: Type.ARRAY, items: { type: Type.STRING, enum: looks } },
          tags: tagsSchema,
          size: { type: Type.STRING },
          confident: { type: Type.BOOLEAN },
        },
        required: ["is_clothing", "multiple_items", "name", "category", "type", "colour", "looks", "tags", "confident"],
      };

  const parts = isCorrection
    ? [{ text: correctionPrompt(current, note) }]
    : [
        { inlineData: { mimeType: "image/jpeg", data: image } },
        { text: photoPrompt },
      ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [{ role: "user", parts }],
      config: { responseMimeType: "application/json", responseSchema: schema },
    });

    return NextResponse.json(JSON.parse(response.text ?? "{}"));
  } catch (err) {
    console.error("Tagging failed:", err);
    const status = String(err).includes("429") ? 429 : 502;
    return NextResponse.json({ error: "Tagging failed" }, { status });
  }
}