const TAMIL_NUMBER_MAP = {
  oru: "1",
  onnu: "1",
  ondru: "1",
  rendu: "2",
  irandu: "2",
  moonu: "3",
  moondru: "3",
  naalu: "4",
  naangu: "4",
  anju: "5",
  aindhu: "5",
};

const REPLACEMENTS = {
  "add pannu": "add",
  "add pannunga": "add",
  "order pannu": "order",
  "order pannunga": "order",
  "venum": "need",
  "kudu": "give",
  "thaa": "give",
  "ku ": " for ",
  "rs.": "rs ",
};

const normalizeTamilInput = (input = "") => {
  let text = String(input).toLowerCase().trim();
  text = text.replace(/\s+/g, " ");

  Object.entries(REPLACEMENTS).forEach(([from, to]) => {
    text = text.replace(new RegExp(from, "g"), to);
  });

  Object.entries(TAMIL_NUMBER_MAP).forEach(([word, value]) => {
    text = text.replace(new RegExp(`\\b${word}\\b`, "g"), value);
  });

  return text.replace(/\s+/g, " ").trim();
};

module.exports = {
  normalizeTamilInput,
  TAMIL_NUMBER_MAP,
};

