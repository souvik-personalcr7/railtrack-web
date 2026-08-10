import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFavorite extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  trainId: string;
  trainNumber: string;
  trainName: string;
  origin: {
    code: string;
    name: string;
  };
  destination: {
    code: string;
    name: string;
  };
  runsOn: string[];
  duration?: string;
  departureTime?: string;
  arrivalTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema: Schema<IFavorite> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    trainId: {
      type: String,
      required: [true, 'Train ID is required'],
    },
    trainNumber: {
      type: String,
      required: [true, 'Train number is required'],
    },
    trainName: {
      type: String,
      required: [true, 'Train name is required'],
    },
    origin: {
      code: { type: String, default: '' },
      name: { type: String, default: '' },
    },
    destination: {
      code: { type: String, default: '' },
      name: { type: String, default: '' },
    },
    runsOn: {
      type: [String],
      default: [],
    },
    duration: {
      type: String,
      default: '',
    },
    departureTime: {
      type: String,
      default: '',
    },
    arrivalTime: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness per user and train
FavoriteSchema.index({ userId: 1, trainNumber: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, trainId: 1 }, { unique: true });

export const Favorite: Model<IFavorite> =
  mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);

export default Favorite;
