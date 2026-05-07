import mongoose from 'mongoose';

const fridgeItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: false
  },
  unit: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Normalizacja nazw do małych liter przed zapisem (zgodnie z pułapką z RESEARCH.md)
fridgeItemSchema.pre('save', function(next) {
  if (this.name) {
    this.name = this.name.toLowerCase();
  }
  next();
});

export const FridgeItem = mongoose.model('FridgeItem', fridgeItemSchema);
