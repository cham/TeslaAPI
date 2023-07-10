const api = require("../src/api/api");

const questions = [
  "Why do you want in?",
  "Apple, Facebook, Google. Fuck, Marry, Kill?",
  "Is a burger a sandwich?",
  "Show us something you've done – can be design, illustration, photography etc etc",
  "How many unread emails do you have in your inbox right now?",
  "How did you find out about Yayhooray?",
  "How do you feel about pillows?",
  'Did you like the movie "Signs", or are you a normal person?',
  "Are you an album person, or a singles person?",
  "Professor, what's another word for 'pirate treasure'?",
  "What the hell is wrong with you?",
  "What is an invention you need invented right now?",
  "Is she cheating on him?",
  "Are you literally a nazi?",
  "Do you promise to be nice?",
  "Are you safe from airborne gluten?",
  "Will you shamelessly share your trainwreck relationship details with Yayhooray?",
  "|_/| /_ /|_ //| _|/ _| //_| _|/ /|_|?",
  "Has someone broken it again? Who broke it?",
  "You're going to be locked inside a small house for one year, you can either choose to do it alone or with nineteen strangers. what's your decision?",
  "How do you pronounce gif?",
  "Professor, what's another word for 'pirate treasure'?",
  "Why not cargo pants?",
  "What are you most proud of achieving this quarter?",
  "When applied to cereal, is milk: A) a broth B) a sauce C) a beverage",
  'Complete this sentence: "I just can\'t stop..."',
  "Does it worth?",
  "What type of soup do you eat most frequently? (If none, say why.)",
  "Should you get a Mac?",
  "Who is your favorite artist or designer?",
  "Are you a dog person, a cat person, or an obscure pet (like a weird lizard or seaweed) person?",
]

for (const i in questions) {
  api.questions.createQuestion({
    query: {
      detail: questions[i]
    }
  }, (err, question) => {
    console.log(`question ${question.id} created!`)
  })
}
