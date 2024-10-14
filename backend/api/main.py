from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables for OpenAI and Unsplash
client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Initialize app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pix-genie.vercel.app"],
    allow_methods=["GET", "OPTIONS", "PATCH", "DELETE", "POST", "PUT"],
    allow_headers=["X-CSRF-Token", "X-Requested-With", "Accept", "Accept-Version", "Content-Length", "Content-MD5", "Content-Type", "Date", "X-Api-Version"],
)

# Data model for the blog content
class BlogContent(BaseModel):
    content: str
    
# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/generate/")
async def generate_keywords(content: BlogContent):
    # Extract keywords from the given blog content using OpenAI
    keywords = []
    try:
        prompt = f"""
        Analyze the following blog content and extract the top 5 keywords that best describe the main themes or topics discussed. 
        The keywords should be relevant, concise, and representative of the blog's content. Return the keywords in a JSON format.
        
        Blog Content:
        {content}
        """
        openai_response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "system", "content": "You are an advanced language model tasked with analyzing blog content and identifying the top 5 most relevant keywords that best represent the main themes or topics discussed. Consider the overall context and key ideas from the blog. Avoid common stop words or overly generic terms. Ensure the keywords are precise, relevant, and descriptive of the blog’s content."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        keywords = openai_response.choices[0].message.content.strip()
        return JSONResponse(content={"keywords": keywords})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")