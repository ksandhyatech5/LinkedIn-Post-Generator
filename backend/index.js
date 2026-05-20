const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// OpenAI Initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Setup Post model
const PostSchema = new mongoose.Schema({
  topic: String,
  tone: String,
  keywords: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Post = mongoose.model('Post', PostSchema);

// Connect to MongoDB
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn("MONGODB_URI not provided. Skipping MongoDB connection.");
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
};

connectDB();

// Prompt Engineering Strategies
const basePrompt = `
You are an expert LinkedIn copywriter and personal branding strategist. 
Your goal is to create posts that are highly engaging, structurally well-paced, and optimized for the LinkedIn algorithm.
Key Guidelines:
- Use a "Scroll-Stopping" hook in the first 1-2 lines.
- Use white space / line breaks between paragraphs for readability.
- Avoid generic cliches ("I'm excited to share", "Honored to be part of").
- End with a strong, curiosity-driven Call to Action (CTA) or a provocative question.
- Length: Aim for 150-250 words to provide real value and depth.
`;

const toneGuidelines = {
    'Professional': `Focus on industry insights, data-backed claims, and authoritative advice. Use clear, sophisticated language. Ideal for establishing thought leadership.`,
    'Motivational': `Focus on personal growth, overcoming obstacles, and "ah-ha" moments. Use high-energy, inspiring language. Include a lesson learned from failure or struggle.`,
    'Storytelling': `Start in the middle of a conflict or a specific moment. Build a narrative arc: Setup -> Struggle -> Discovery -> Resolution. Use descriptive, emotive language.`,
    'Casual & Humorous': `Use wit, relatability, and lighthearted observations. Can include self-deprecating humor or play on common industry frustrations. Keep it human and approachable.`
};

const structuredMockAssets = {
    hooks: [
        "The landscape of {topic} is shifting faster than most organizations can adapt. 📉",
        "I failed 100 times before I got it right regarding {topic}. 🚀",
        "Is it just me, or is {topic} actually just 90% drinking coffee and 10% questioning your life choices? ☕️",
        "Why do 70% of initiatives relating to {topic} fail to meet their objectives? 🔍",
        "Six months ago, I was ready to walk away from {topic}. 🚪",
        "Everything I thought I knew about {topic} was flipped upside down by a single conversation. 🗣️",
        "LinkedIn version of me: 'Thrive in the face of {topic}.' Real version: 'Pajamas at 2 PM.' 👔",
        "Investment in {topic} is no longer optional—it's a prerequisite for market relevance. 💡"
    ],
    bodies: {
        'Professional': [
            "After analyzing current trends, it’s clear that traditional models are no longer sufficient. To stay competitive, leaders must pivot towards a more integrated approach.\n\nKey pillars for success:\n1. Strategic Alignment: Ensuring roadmap matches behavior.\n2. Iterative Development: Moving from 'perfection' to 'progress'.\n3. Data Integrity: Decisions based on evidence, not intuition.",
            "It’s rarely a lack of talent. It’s almost always a lack of systemic clarity. When goals aren't aligned with execution, friction is inevitable.\n\nEffective leadership in this space requires:\n- Clear communication of 'The Why'.\n- Empowering teams to own the outcome, not just the task.\n- Continuous feedback loops.",
            "As we look toward the next fiscal year, the organizations that prioritize resilience and scalability will outperform their peers. It's time to move beyond tactical 'fixes' and toward sustainable systems."
        ],
        'Motivational': [
            "Most people see the win, but they don't see the 3 AM sessions, the 'no's', and the moments of doubt. Here is what I learned:\n- Persistence is the only shortcut.\n- Your 'why' must be bigger than your fear.\n- Every 'no' is just data for your next 'yes'.",
            "Stop waiting for the 'perfect moment' to start. It doesn't exist. I used to think I needed more experience. The truth? I just needed to start.\n\nGrowth happens in the discomfort zone. If it's easy, you're not growing.",
            "I’ve realized that 90% of the battle is internal. If you believe you can, or you believe you can't—you're right. Don't let the noise of other people's opinions drown out your inner voice."
        ],
        'Storytelling': [
            "It was a rainy Tuesday, and I was looking at the results. I thought I knew what I was doing. I was wrong. I spent months trying to force a result that wasn't coming.\n\nThen, I tried a different approach. I stopped focusing on the outcome and started focusing on the process.",
            "But instead of quitting, I decided to ask for help. I reached out to a mentor and shared my frustrations. Their advice changed everything: 'You're trying to build a cathedral when you haven't laid the foundation.'",
            "I was at a conference, feeling like an expert, until I met someone who had been doing this for 30 years. They didn't give me a secret formula. They just asked me one question that exposed every flaw in my logic."
        ],
        'Casual & Humorous': [
            "I was trying to explain what I do to my parents yesterday and realized... even I'm not sure sometimes. We spend so much time trying to look professional, but behind the scenes, we're all just trying to figure it out one tab at a time.",
            "My strategy is basically 'Hope for the best and prepare for the inevitable chaos'. They told me this would be automated and 'seamless'. They lied. Currently accepting applications for a full-time 'Adult' to help me navigate this.",
            "Just finished my third 'final' draft and I'm currently wearing pajamas. Let's be honest: the highlight reel is great, but the blooper reel is where the real work happens."
        ]
    },
    ctas: [
        "What are your thoughts on this? Let's discuss in the comments! 👇",
        "Are you building for today, or for the future?",
        "Efficiency isn't about doing more; it's about doing what matters. Do you agree?",
        "If you're feeling stuck today, remember that the biggest breakthroughs happen right after you want to quit.",
        "What's one thing you've learned recently that changed your perspective?",
        "Drop a '🚀' if you're ready to take the next step!"
    ]
};

const generateMockPost = (topic, tone) => {
    const currentTone = tone || 'Professional';
    const hook = structuredMockAssets.hooks[Math.floor(Math.random() * structuredMockAssets.hooks.length)].replace('{topic}', topic);
    const bodyTemplates = structuredMockAssets.bodies[currentTone] || structuredMockAssets.bodies['Professional'];
    const body = bodyTemplates[Math.floor(Math.random() * bodyTemplates.length)];
    const cta = structuredMockAssets.ctas[Math.floor(Math.random() * structuredMockAssets.ctas.length)];

    return `${hook}\n\n${body}\n\n${cta}`;
};

app.post('/api/posts/generate', async (req, res) => {
    try {
        const { topic, tone, keywords } = req.body;
        
        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }

        const currentTone = tone || 'Professional';
        const specificGuideline = toneGuidelines[currentTone] || toneGuidelines['Professional'];

        const prompt = `
${basePrompt}

Write a LinkedIn post about the following topic: "${topic}".
Tone: ${currentTone}
Guidelines for this tone: ${specificGuideline}

${keywords ? `Keywords to include: ${keywords}` : ''}

Structure:
1. Hook: 1-2 lines that grab attention.
2. The "Why": Why does this matter now?
3. The Meat: 3-4 bullet points or short paragraphs of value/story.
4. The Takeaway: A clear lesson or summary.
5. CTA: An engaging ending.
6. 3-5 relevant hashtags.
`;

        // If OPENAI key is not set or dummy, we provide dynamic mock output based on tone
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
            console.log("Using Mock AI Response for Tone:", currentTone);
            
            let mockContent = generateMockPost(topic, currentTone);
            
            const keyList = keywords ? keywords.split(',').map(k => k.trim()) : [];
            if (keyList.length > 0) {
                mockContent += `\n\nSpecifically focusing on: ${keyList.join(', ')}.`;
            }

            const tagStr = `\n\n#${currentTone.replace(/\s/g, '')} #${keyList[0] || 'Success'} #LinkedInGen`;
            mockContent += tagStr;
            
            const newPost = new Post({ topic, tone: currentTone, keywords, content: mockContent });
            if (mongoose.connection.readyState === 1) await newPost.save();
            
            return res.status(200).json({ post: mockContent, id: newPost._id, isMock: true });
        }

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
            temperature: 0.7,
        });

        const generatedContent = completion.choices[0].message.content;

        const newPost = await Post.create({
            topic, tone, keywords, content: generatedContent
        });

        res.status(200).json({ post: generatedContent, id: newPost._id });

    } catch (error) {
        console.error("Error generating post:", error);
        res.status(500).json({ error: "Failed to generate post" });
    }
});

app.post('/api/posts/improve', async (req, res) => {
    try {
        const { currentContent, feedback } = req.body;
        
        if (!currentContent) {
            return res.status(400).json({ error: "Current content is required to improve." });
        }

        const improvementPrompt = `
${basePrompt}

Here is an existing LinkedIn post:
"""
${currentContent}
"""

Please improve this post based on the following instruction/feedback: "${feedback || 'Make it punchier, more engaging, and improve the hook.'}"
Return ONLY the improved post text. Do not reply with conversational filler like "Here is the improved post:".
`;

        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
             // Mock improvement with more variety and simulated logic
             const feedbackLower = (feedback || '').toLowerCase();
             
             let improvedResult = currentContent;

             if (feedbackLower.includes('shorter') || feedbackLower.includes('concise')) {
                 improvedResult = currentContent.split('\n').slice(0, 5).join('\n') + "\n\n(Optimized for conciseness as requested! ⚡️)";
             } else if (feedbackLower.includes('hook') || feedbackLower.includes('exciting')) {
                 const newHook = "STOP scroll-watching for a second. This is important. 🚨";
                 improvedResult = newHook + "\n\n" + currentContent.split('\n').slice(1).join('\n');
             } else if (feedbackLower.includes('hashtag')) {
                 improvedResult = currentContent + "\n#Innovation #Strategy #Growth";
             } else {
                 const enhancements = [
                     `PRO TIP: I've added a more punchy conclusion here.\n\n${currentContent}`,
                     `${currentContent}\n\n[Refined via AI Feedback Loop]`,
                     `[Self-Correction] I've smoothed out the transition in the second paragraph.\n\n${currentContent}`
                 ];
                 improvedResult = enhancements[Math.floor(Math.random() * enhancements.length)];
             }

             return res.status(200).json({ post: improvedResult });
        }

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: improvementPrompt }],
            model: "gpt-3.5-turbo",
            temperature: 0.7,
        });

        res.status(200).json({ post: completion.choices[0].message.content });

    } catch (error) {
        console.error("Error improving post:", error);
        res.status(500).json({ error: "Failed to improve post" });
    }
});

app.get('/api/posts/history', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json([]);
        }
        const posts = await Post.find().sort({ createdAt: -1 }).limit(20);
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
