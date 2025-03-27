import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { Document } from "@langchain/core/documents";

class DocumentProcessor {
    constructor() {
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            lengthFunction: (text) => text.length,
        });
        this.embeddings = new OllamaEmbeddings({
            model: "mistral",
            baseUrl: process.env.OLLAMA_API_URL || "http://localhost:11434",
        });
    }

    async processText(text, metadata = {}) {
        try {
            // Split text into chunks
            const docs = await this.textSplitter.createDocuments([text]);
            
            // Add metadata to each document
            const documentsWithMetadata = docs.map(doc => {
                return new Document({
                    pageContent: doc.pageContent,
                    metadata: {
                        ...doc.metadata,
                        ...metadata,
                        timestamp: new Date().toISOString()
                    }
                });
            });

            // Generate embeddings for each chunk
            const vectors = await this.embeddings.embedDocuments(
                documentsWithMetadata.map(doc => doc.pageContent)
            );

            return {
                documents: documentsWithMetadata,
                vectors: vectors
            };
        } catch (error) {
            console.error('Error processing document:', error);
            throw error;
        }
    }

    async generateEmbedding(text) {
        try {
            return await this.embeddings.embedQuery(text);
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }
}

export default DocumentProcessor; 