import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: String,
  unit: String,
  isOwned: { type: Boolean, default: true }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  ingredients: [ingredientSchema],
  instructions: [String],
  prepTimeMinutes: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Recipe = mongoose.model('Recipe', recipeSchema);
