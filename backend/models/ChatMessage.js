import mongoose from "mongoose";
const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    userId:         { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: { type: String, required: true }, // UUID — groups one chat session

    role:    { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },

    // RAG metadata — stored for quality analysis and prompt tuning
    ragContext: {
      retrievedChunks: { type: [String], default: [] }, // KB chunk IDs used
      vectorScore:     { type: Number, default: null },  // top cosine similarity
    },

    tokens:    { type: Number, default: null }, // token count for cost tracking
    modelUsed: { type: String, default: null }, // "gpt-4o-mini"

    createdAt: { type: Date, default: Date.now }, // TTL index on this field
  }
  // No timestamps: true — createdAt is manual (TTL needs it on this exact field)
);

// Indexes
chatMessageSchema.index({ userId: 1, conversationId: 1, createdAt: 1 });

// TTL: auto-delete chat history older than 30 days
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", chatMessageSchema);
