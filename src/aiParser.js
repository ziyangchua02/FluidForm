import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

export async function parseFormWithAI(text) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are an AI that extracts form fields from user speech.

Return ONLY JSON.

Fields:
name, email, phone, age, message

If not mentioned, leave empty string.
        `,
      },
      { role: "user", content: text },
    ],
    temperature: 0,
  });

  return JSON.parse(response.choices[0].message.content);
}
