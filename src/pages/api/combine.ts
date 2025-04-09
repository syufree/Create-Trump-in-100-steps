import { Element, ElementModel } from "@/interfaces/element";
import connectDb from "@/libs/connect-db";
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 预定义的组合规则
type Rule = {
  emoji: string;
  text: string;
};

type PredefinedRules = {
  [key: string]: Rule;
};

const predefinedRules: PredefinedRules = {
  // Trump synthesis route starting from default elements (within 100 steps)
  "grass,sun": { emoji: "🌳", text: "tree" },           // Step 1: grass + sun = tree
  "tree,sun": { emoji: "🌲", text: "forest" },          // Step 2: tree + sun = forest
  "forest,tree": { emoji: "🌿", text: "nature" },       // Step 3: forest + tree = nature
  "nature,sun": { emoji: "🌍", text: "earth" },         // Step 4: nature + sun = earth
  "earth,nature": { emoji: "🌱", text: "life" },        // Step 5: earth + nature = life
  "life,earth": { emoji: "👥", text: "people" },        // Step 6: life + earth = people
  "people,life": { emoji: "👨‍🌾", text: "farmer" },      // Step 7: people + life = farmer
  "farmer,earth": { emoji: "🏠", text: "house" },       // Step 8: farmer + earth = house
  "house,people": { emoji: "🏘️", text: "village" },     // Step 9: house + people = village
  "village,house": { emoji: "🏙️", text: "city" },       // Step 10: village + house = city
  "city,village": { emoji: "🌆", text: "metropolis" },  // Step 11: city + village = metropolis
  "metropolis,city": { emoji: "🗽", text: "newyork" },  // Step 12: metropolis + city = newyork
  "newyork,people": { emoji: "💰", text: "money" },     // Step 13: newyork + people = money
  "money,metropolis": { emoji: "🏢", text: "business" }, // Step 14: money + metropolis = business
  "business,money": { emoji: "📈", text: "success" },   // Step 15: business + money = success
  "success,business": { emoji: "🎯", text: "ambition" }, // Step 16: success + business = ambition
  "ambition,success": { emoji: "🏛️", text: "congress" }, // Step 17: ambition + success = congress
  "congress,people": { emoji: "⚖️", text: "law" },      // Step 18: congress + people = law
  "law,congress": { emoji: "📜", text: "constitution" }, // Step 19: law + congress = constitution
  "constitution,law": { emoji: "🎭", text: "politics" }, // Step 20: constitution + law = politics
  "politics,people": { emoji: "🗳️", text: "vote" },     // Step 21: politics + people = vote
  "vote,politics": { emoji: "🎪", text: "campaign" },   // Step 22: vote + politics = campaign
  "campaign,vote": { emoji: "📢", text: "rally" },      // Step 23: campaign + vote = rally
  "rally,people": { emoji: "🎤", text: "speech" },      // Step 24: rally + people = speech
  "speech,campaign": { emoji: "📺", text: "media" },    // Step 25: speech + campaign = media
  "media,speech": { emoji: "🌟", text: "celebrity" },   // Step 26: media + speech = celebrity
  "celebrity,media": { emoji: "🎬", text: "reality" },  // Step 27: celebrity + media = reality
  "reality,celebrity": { emoji: "👨‍💼", text: "trump" },  // Step 28: reality + celebrity = trump

  // Other possible combinations (for exploration)
  "grass,grass": { emoji: "🌿", text: "plants" },
  "sun,sun": { emoji: "🌞", text: "sunshine" },
  
  // Urban development route
  "water,fire": { emoji: "🏭", text: "factory" },
  "factory,forest": { emoji: "🏢", text: "city" },
  "city,water": { emoji: "🌊", text: "ocean" },
  "ocean,fire": { emoji: "🚢", text: "ship" },
  "ship,city": { emoji: "🗽", text: "newyork" },
  
  // Political route
  "newyork,ocean": { emoji: "🏛️", text: "government" },
  "government,fire": { emoji: "👨‍💼", text: "trump" },
  
  // Simple route
  "grass,water": { emoji: "🌱", text: "plant" },
  "plant,sun": { emoji: "🌺", text: "flower" },
  "flower,water": { emoji: "🌹", text: "rose" },
  "rose,fire": { emoji: "💐", text: "bouquet" },
  "bouquet,water": { emoji: "🌷", text: "tulip" },
  "tulip,sun": { emoji: "🌻", text: "sunflower" },
  "sunflower,water": { emoji: "🌼", text: "daisy" },
  "daisy,fire": { emoji: "🌸", text: "cherry" },
  "cherry,water": { emoji: "🍒", text: "cherries" },
  "cherries,sun": { emoji: "🍎", text: "apple" },
  "apple,fire": { emoji: "🍏", text: "greenapple" },
  "greenapple,water": { emoji: "🍐", text: "pear" },
  "pear,sun": { emoji: "🍊", text: "orange" },
  "orange,fire": { emoji: "🍋", text: "lemon" },
  "lemon,water": { emoji: "🍌", text: "banana" },
  "banana,sun": { emoji: "🍉", text: "watermelon" },
  "watermelon,fire": { emoji: "🍇", text: "grape" },
  "grape,water": { emoji: "🍓", text: "strawberry" },
  "strawberry,sun": { emoji: "🍑", text: "peach" },
  "peach,fire": { emoji: "👨‍💼", text: "trump" },
  
  // Other interesting combinations
  "insect,water": { emoji: "🐟", text: "fish" },
  "fish,ocean": { emoji: "🐋", text: "whale" },
  "whale,ship": { emoji: "🌊", text: "tsunami" },
  "tsunami,city": { emoji: "🏗️", text: "construction" },
  "construction,government": { emoji: "🏰", text: "castle" },
};

type ResponseData = {
  message: string;
  element?: Element;
  discovered?: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const w1 = req.query.word1 as string;
  const w2 = req.query.word2 as string;

  console.log(`Combining elements: ${w1} and ${w2}`);

  if (!w1 || !w2) {
    res.status(400).json({ message: "Bad Request" });
    return;
  }

  // Normalize and sort words
  const word1 = w1.toLowerCase();
  const word2 = w2.toLowerCase();
  const sortedWord1 = word1 > word2 ? word1 : word2;
  const sortedWord2 = word1 > word2 ? word2 : word1;

  console.log(`Normalized and sorted: ${sortedWord1} and ${sortedWord2}`);
  console.log(`Rule key: ${sortedWord1},${sortedWord2}`);
  console.log(`Predefined rules: ${JSON.stringify(predefinedRules)}`);

  // Connect to database first
  try {
    await connectDb();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to database:", error);
    return res.status(500).json({ message: "Database connection error" });
  }

  // First check predefined rules
  const ruleKey = `${sortedWord1},${sortedWord2}`;
  const reverseRuleKey = `${sortedWord2},${sortedWord1}`;
  console.log(`Checking predefined rule with key: ${ruleKey} and reverse key: ${reverseRuleKey}`);
  console.log(`Available predefined rules: ${Object.keys(predefinedRules).join(', ')}`);
  console.log(`Rule exists: ${!!predefinedRules[ruleKey] || !!predefinedRules[reverseRuleKey]}`);
  
  if (predefinedRules[ruleKey] || predefinedRules[reverseRuleKey]) {
    const rule = predefinedRules[ruleKey] || predefinedRules[reverseRuleKey];
    console.log(`Found predefined rule for ${ruleKey} or ${reverseRuleKey}: ${rule.emoji} - ${rule.text}`);
    
    // Check if this predefined rule is already in the database
    try {
      const existingElement = await ElementModel.findOne({
        word1: sortedWord1,
        word2: sortedWord2,
      });
      
      console.log(`Existing element in database: ${existingElement ? 'Yes' : 'No'}`);
      
      // If not in database, save it
      if (!existingElement) {
        console.log(`Saving predefined rule to database: ${rule.emoji} - ${rule.text}`);
        const newElement = new ElementModel({
          word1: sortedWord1,
          word2: sortedWord2,
          emoji: rule.emoji,
          text: rule.text,
        });
        await newElement.save();
      } else {
        console.log(`Predefined rule already exists in database`);
      }
      
      return res.status(200).json({
        message: "Element created from predefined rule",
        element: {
          emoji: rule.emoji,
          text: rule.text,
          discovered: true,
        },
      });
    } catch (error) {
      console.error("Error checking existing element:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    console.log(`No predefined rule found for ${ruleKey}`);
  }

  // If no predefined rule exists, check database for existing combinations
  console.log(`Checking database for existing combination`);
  try {
    const existingElement = await ElementModel.findOne({
      word1: sortedWord1,
      word2: sortedWord2,
    });

    console.log(`Existing element in database: ${existingElement ? 'Yes' : 'No'}`);

    if (existingElement) {
      console.log(`Found existing element in database: ${existingElement.emoji} - ${existingElement.text}`);
      return res.status(200).json({
        message: "Element already exists",
        element: {
          emoji: existingElement.emoji,
          text: existingElement.text,
          discovered: false,
        },
      });
    }
  } catch (error) {
    console.error("Error checking existing element:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

  // If not in database, finally call AI to generate new combinations
  console.log(`No existing combination found, calling OpenAI API`);
  try {
    console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`);
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
          You are a creative game designer for an emoji combination game.
          Generate a meaningful emoji and word that represents the combination of two given elements.
          The combination should be creative and make sense in the context of the game.

          Your response must follow this exact format:
          [emoji],[word in English]
          
          Example 1:
          air and water = 💧,rain

          Example 2:
          wind and sun = 🌬️,breeze

          Example 3:
          fire and water = 🔥,steam

          Example 4:
          earth and water = 🌊,mud

          Example 5:
          earth and fire = 🌋,lava
          `,
        },
        { role: "user", content: `${sortedWord1} and ${sortedWord2} =` },
      ],
      model: "gpt-4o-mini",
      max_tokens: 512,
    });

    console.log(`OpenAI API response received`);

    const output = chatCompletion.choices[0]?.message?.content?.trim();
    if (!output) {
      console.error("No output generated by OpenAI");
      throw new Error("No output generated by OpenAI");
    }

    console.log(`OpenAI API response: ${output}`);

    // Parse the output
    const splitOutput = output.split(",");
    console.log(`Split output: ${JSON.stringify(splitOutput)}`);
    
    if (splitOutput.length !== 2) {
      console.error(`Invalid format in OpenAI response: ${output}`);
      throw new Error("Invalid format in OpenAI response");
    }

    const [emoji, text] = splitOutput.map((item) => item.trim());
    console.log(`Parsed emoji: ${emoji}, text: ${text}`);
    
    const normalizedText = text.toLowerCase();
    console.log(`Normalized text: ${normalizedText}`);

    // Check if generated text already exists in the database
    const existingElementByText = await ElementModel.findOne({
      text: normalizedText,
    });

    if (existingElementByText) {
      console.log(`Generated text already exists in database: ${existingElementByText.emoji} - ${existingElementByText.text}`);
      return res.status(200).json({
        message: "Text already exists",
        element: {
          emoji: existingElementByText.emoji,
          text: existingElementByText.text,
          discovered: false,
        },
      });
    }

    // Save the new element
    console.log(`Saving new element to database: ${emoji} - ${normalizedText}`);
    try {
      const newElement = new ElementModel({
        word1: sortedWord1,
        word2: sortedWord2,
        emoji,
        text: normalizedText,
      });
      await newElement.save();
      console.log(`New element saved to database successfully`);
    } catch (error) {
      console.error("Error saving new element to database:", error);
      throw error;
    }

    return res.status(200).json({
      message: "New element created",
      element: {
        emoji,
        text: normalizedText,
        discovered: true,
      },
    });
  } catch (error) {
    console.error("Error generating or saving element:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
