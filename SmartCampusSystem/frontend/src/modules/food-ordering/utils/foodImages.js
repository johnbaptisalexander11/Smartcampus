import vegSandwich from "../../../foodItems/Veg Sandwich.jpg";
import idliSambar from "../../../foodItems/Idli Sambar.jpg";
import thaliMeal from "../../../foodItems/Thali Meal.jpg";
import coldCoffee from "../../../foodItems/Cold Coffee.webp";
import chickenFriedRice from "../../../foodItems/Chicken Fried Rice.jpg";
import chocolateMuffin from "../../../foodItems/Chocolate Muffin.jpg";

/** Local photos from `src/foodItems` — keyed by normalized food name */
const FOOD_IMAGE_BY_NAME = {
  "veg sandwich": vegSandwich,
  "idli sambar": idliSambar,
  "thali meal": thaliMeal,
  "cold coffee": coldCoffee,
  "chicken fried rice": chickenFriedRice,
  "chocolate muffin": chocolateMuffin,
};

const normalizeName = (name = "") =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

/**
 * Returns the local foodItems photo for a dish name, or null if none matches.
 */
export const getLocalFoodImage = (name = "") => {
  const key = normalizeName(name);
  if (FOOD_IMAGE_BY_NAME[key]) return FOOD_IMAGE_BY_NAME[key];

  // Soft match: filename words contained in item name (or vice versa)
  const entry = Object.entries(FOOD_IMAGE_BY_NAME).find(
    ([foodName]) => key.includes(foodName) || foodName.includes(key)
  );
  return entry ? entry[1] : null;
};

export default FOOD_IMAGE_BY_NAME;
