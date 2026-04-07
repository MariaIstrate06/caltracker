import os
import json

os.chdir('/Users/istrate/Desktop/Desktop - Maria' + "'"'s MacBook Pro/code <>/cal-track')

# Read firebase.service.ts
with open("src/app/firebase.service.ts") as f:
    firebase_content = f.read()

# Update interface
firebase_content = firebase_content.replace(
    'export interface CalTrackState {\n  targetCalories: number;\n  mealHistory: any[];\n  customIngredients: any[];\n}',
    'export interface CalTrackState {\n  targetCalories: number;\n  targetProtein: number;\n  mealHistory: any[];\n  customIngredients: any[];\n  emoji?: string;\n}'
)

# Update createProfile
firebase_content = firebase_content.replace(
    '  async createProfile(profileName: string): Promise<void>',
    '  async createProfile(profileName: string, emoji: string): Promise<void>'
).replace(
    '    targetCalories: 2000,\n        mealHistory: [],\n        customIngredients: []',
    '    targetCalories: 1700,\n        targetProtein: 133.5,\n        mealHistory: [],\n        customIngredients: [],\n        emoji'
)

with open("src/app/firebase.service.ts", "w") as f:
    f.write(firebase_content)

print("✓ Updated firebase.service.ts")
