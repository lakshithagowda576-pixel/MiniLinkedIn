const User = require("./models/User");
const Post = require("./models/Post");

async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Database already populated. Skipping seed.");
      return;
    }

    console.log("Seeding database with initial users and posts...");

    const users = await User.insertMany([
      {
        firebaseUid: "mock-uid-alex-1",
        name: "Alex Johnson",
        email: "alex.j@example.com",
        profilePicture: "https://ui-avatars.com/api/?name=Alex+Johnson&background=0a66c2&color=fff",
        bio: "Senior Frontend Developer at Meta | React & Vue enthusiast | Building the future of the web.",
        skills: ["React", "JavaScript", "Frontend Development", "CSS"],
      },
      {
        firebaseUid: "mock-uid-sarah-2",
        name: "Sarah Connor",
        email: "s.connor@example.com",
        profilePicture: "https://ui-avatars.com/api/?name=Sarah+Connor&background=6c5ce7&color=fff",
        bio: "AI Researcher | Tech Enthusiast | Passionate about Machine Learning and AI ethics.",
        skills: ["Machine Learning", "Python", "AI", "Data Science"],
      },
      {
        firebaseUid: "mock-uid-michael-3",
        name: "Michael Chen",
        email: "m.chen@example.com",
        profilePicture: "https://ui-avatars.com/api/?name=Michael+Chen&background=34a853&color=fff",
        bio: "Product Designer @ Google. I design experiences that make people smile. Typography & minimalism.",
        skills: ["UI/UX", "Figma", "Product Design", "Typography"],
      }
    ]);

    await Post.insertMany([
      {
        author: users[0]._id, // Alex
        caption: "Just launched a new React library for advanced animations! 🚀 So excited to share this with the community after 3 months of hard work. Check it out on npm: react-super-anim #React #Frontend",
        mentionedSkills: ["React", "Frontend", "JavaScript"],
      },
      {
        author: users[1]._id, // Sarah
        caption: "Attended an amazing conference on the future of AI and ethics today. The capabilities of modern LLMs are blowing my mind, but we must stay vigilant about biases. 🤖✨",
        mentionedSkills: ["AI", "Machine Learning"],
      },
      {
        author: users[2]._id, // Michael
        caption: "The role of whitespace in UI design is often underestimated. Sometimes, giving elements space to breathe is the best feature you can add. What are your thoughts? #design #uiux",
        mentionedSkills: ["UI/UX", "Product Design"],
      }
    ]);

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
  }
}

module.exports = seedDatabase;
