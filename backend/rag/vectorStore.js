import { ChromaClient } from 'chromadb';
import { Document } from '@langchain/core/documents';

class VectorStore {
    constructor() {
        // Use localhost if running locally, or the service name if running in Docker
        const chromaHost = process.env.CHROMA_DB_PATH || "http://localhost:8000";
        console.log(`Connecting to ChromaDB at: ${chromaHost}`);
        
        this.client = new ChromaClient({
            path: chromaHost
        });
        this.collectionName = "documents";
        this.collection = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Test connection first
            await this.client.heartbeat();
            
            // Create or get collection
            this.collection = await this.client.getOrCreateCollection({
                name: this.collectionName,
                metadata: { "hnsw:space": "cosine" }
            });
            
            this.initialized = true;
            console.log('Successfully initialized ChromaDB connection');
        } catch (error) {
            console.error('Error initializing vector store:', error);
            // Don't throw the error, just log it
            // This allows the application to start even if ChromaDB is not available
            this.initialized = false;
        }
    }

    async addDocuments(documents, vectors) {
        if (!this.initialized) {
            throw new Error('Vector store not initialized. Please ensure ChromaDB is running.');
        }

        try {
            // Prepare data for ChromaDB
            const ids = documents.map((_, index) => `doc_${Date.now()}_${index}`);
            const metadatas = documents.map(doc => doc.metadata);

            // Add documents to ChromaDB
            await this.collection.add({
                ids: ids,
                embeddings: vectors,
                metadatas: metadatas,
                documents: documents.map(doc => doc.pageContent)
            });

            return ids;
        } catch (error) {
            console.error('Error adding documents to vector store:', error);
            throw error;
        }
    }

    async similaritySearch(query, k = 4) {
        if (!this.initialized) {
            throw new Error('Vector store not initialized. Please ensure ChromaDB is running.');
        }

        try {
            // Search for similar documents
            const results = await this.collection.query({
                queryTexts: [query],
                nResults: k
            });

            // Convert results to Document objects
            return results.documents[0].map((content, index) => {
                return new Document({
                    pageContent: content,
                    metadata: results.metadatas[0][index]
                });
            });
        } catch (error) {
            console.error('Error performing similarity search:', error);
            throw error;
        }
    }

    async deleteCollection() {
        if (!this.initialized) {
            throw new Error('Vector store not initialized. Please ensure ChromaDB is running.');
        }

        try {
            await this.client.deleteCollection({
                name: this.collectionName
            });
            this.collection = null;
            this.initialized = false;
        } catch (error) {
            console.error('Error deleting collection:', error);
            throw error;
        }
    }
}

export default VectorStore; 