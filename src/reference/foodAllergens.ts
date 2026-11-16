// The 14 major food allergen groups that EU law requires labels to highlight (Regulation (EU) No 1169/2011,
// Annex II), as whole words, including the botanical names cosmetics use for the same foods ("Arachis Hypogaea
// Oil" is peanut oil). Hand-checked; a group is matched only as whole words, so "buckwheat" is not wheat.
const GROUPS: { group: string; words: RegExp }[] = [
  {
    group: 'Gluten (wheat, rye, barley, oats)',
    words: /\b(?:wheat|rye|barley|oats?|oatmeal|spelt|kamut|gluten|triticum|hordeum|secale|avena)\b/,
  },
  { group: 'Crustaceans', words: /\b(?:crustaceans?|shrimps?|prawns?|crabs?|lobsters?|crayfish|krill)\b/ },
  { group: 'Egg', words: /\b(?:eggs?|albumen|ovalbumin)\b/ },
  { group: 'Fish', words: /\b(?:fish|anchov(?:y|ies)|tuna|salmon|cod|sardines?|mackerel|haddock)\b/ },
  { group: 'Peanuts', words: /\b(?:peanuts?|groundnuts?|arachis)\b/ },
  { group: 'Soy', words: /\b(?:soy|soya|soybeans?|glycine (?:soja|max))\b/ },
  {
    group: 'Milk',
    // "Butter" alone is dairy; shea, cocoa and other plant butters are not.
    words: /\b(?:milk|milks|whey|casein|caseinates?|lactose|yog(?:h)?urt|cheese|ghee|buttermilk|(?<!(?:shea|cocoa|cacao|mango|kokum|murumuru|cupuacu|seed|kernel|nut|parkii|illipe|sal|avocado|olive|almond|peanut|cashew)\s)butter)\b/,
  },
  {
    group: 'Tree nuts',
    words:
      /\b(?:almonds?|hazelnuts?|walnuts?|cashews?|pecans?|brazil nuts?|pistachios?|macadamia|prunus amygdalus|corylus|juglans|anacardium|bertholletia|pistacia|carya)\b/,
  },
  { group: 'Celery', words: /\b(?:celery|celeriac|apium graveolens)\b/ },
  { group: 'Mustard', words: /\b(?:mustard|sinapis)\b/ },
  { group: 'Sesame', words: /\b(?:sesame|sesamum)\b/ },
  { group: 'Sulphites', words: /\b(?:sulph?ites?|sulfites?|(?:meta)?bisulph?ites?|(?:meta)?bisulfites?|sulph?ur dioxide|sulfur dioxide|e ?22[0-8])\b/ },
  { group: 'Lupin', words: /\b(?:lupins?|lupines?|lupinus)\b/ },
  { group: 'Molluscs', words: /\b(?:molluscs?|mollusks?|mussels?|oysters?|clams?|squids?|octopus|scallops?|snails?)\b/ },
]

const ORDER = ['Milk', 'Egg', 'Peanuts', 'Tree nuts', 'Gluten (wheat, rye, barley, oats)', 'Soy', 'Fish', 'Crustaceans', 'Molluscs', 'Celery', 'Mustard', 'Sesame', 'Lupin', 'Sulphites']

export function foodAllergens(ingredient: string): string[] {
  // Brackets and punctuation become spaces, so "Butyrospermum Parkii (Shea) Butter" reads "... shea butter".
  const text = ingredient.toLowerCase().replace(/[()[\],;:]/g, ' ').replace(/\s+/g, ' ')
  return GROUPS.filter((g) => g.words.test(text))
    .map((g) => g.group)
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
}
