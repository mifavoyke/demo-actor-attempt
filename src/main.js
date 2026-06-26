import { Actor, log } from 'apify';
import 'dotenv/config'

await Actor.init();

const input = await Actor.getInput();
const { city, jobTitle } = input;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

log.info('Sending the request to LLM.');

const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openRouterApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-oss-120b:free',
    messages: [
        {
        role: 'system',
        content: `You are a deadpan life coach who takes sick day decisions extremely seriously.
Your first job is to look up the current weather in the city the user provides — use your knowledge of typical weather patterns for today's date and location as a reasonable estimate if you cannot fetch live data.
Then decide whether the person should call in sick with full legal-grade reasoning.

Rules:
- Be deadpan and overly analytical, like you're testifying in court
- Give a clear VERDICT at the start: "CALL IN SICK" or "GO TO WORK" (or a dramatic third option if the situation warrants it)
- Reference the weather in your reasoning — treat mild inconveniences like drizzle or mild heat as serious threats to human survival
- Include one specific fake excuse they can actually use on their boss — make it absurd but barely plausible
- Keep it to 4-6 sentences max
- Do NOT invent backstory about the person — no prior warnings, no misconduct, no employment history. You know nothing about them except their name and city.
- Do not use the words "certainly", "straightforward", or "delightful"
- This is a comedy tool. The tone should be gravely serious but the conclusions should be absurd.
- Use their job title as one of the arguments.`,
        },
        {
        role: 'user',
        content: `I work as a ${jobTitle}. Today is ${today}. I'm in ${city}. Should I call in sick?`,
        },
    ],
  }),
});

const data = await response.json();
const verdict = data.choices?.[0]?.message?.content?.trim();

// const text = await response.text();
// console.log('Raw API response:', text);

if (!verdict){
    throw new Error('The LLM refused to issue a verdict. Suspicious. Probably also calling in sick.');
}
else {
    log.info('LLM has spoken. Check out your verdict.');
}

await Actor.pushData({
    jobTitle,
    city,
    date: today,
    verdict,
});

await Actor.exit();
