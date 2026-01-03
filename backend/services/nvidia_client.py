"""
Resume Reactor - NVIDIA NIM Client
Wrapper for NVIDIA's inference API (OpenAI-compatible)
"""
from openai import OpenAI
from config import NVIDIA_API_KEY, NVIDIA_BASE_URL, TEXT_MODEL, VISION_MODEL


def get_nvidia_client():
    """Get NVIDIA NIM client using OpenAI-compatible API"""
    return OpenAI(
        base_url=NVIDIA_BASE_URL,
        api_key=NVIDIA_API_KEY
    )


async def generate_text(
    prompt: str,
    system_prompt: str = "You are an expert resume writer and ATS optimization specialist.",
    max_tokens: int = 1024,
    temperature: float = 0.7
) -> str:
    """
    Generate text using NVIDIA NIM Llama model
    """
    client = get_nvidia_client()
    
    try:
        response = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"NVIDIA API error: {e}")
        # Fallback response if API fails
        return f"[API Error: {str(e)}. Please check your NVIDIA API key.]"


async def analyze_image(
    image_base64: str,
    prompt: str = "Describe this image from a resume. Identify any certifications, skills, project screenshots, or achievements shown."
) -> str:
    """
    Analyze an image using NVIDIA NIM Vision model
    """
    client = get_nvidia_client()
    
    try:
        response = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=512
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Vision API error: {e}")
        return f"[Could not analyze image: {str(e)}]"
