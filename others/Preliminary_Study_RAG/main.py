from dotenv import load_dotenv
from llm import initialize_LLM, ask_question
import os

# Load environment variables
load_dotenv()

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
os.environ["GEMINI_API_KEY"] = GOOGLE_API_KEY

# Initialize the system
qa = initialize_LLM()

# Ask questions and retrieve answers
question_1 = "give me a method signature which is type annotated, if not found then pick any random one and add type annotation"
answer_1 = ask_question(qa, question_1)
print(f"Answer 1: {answer_1}")

# question_2 = "add proper type annotation with small reasoning description about why and which type hints is added"
# answer_2 = ask_question(qa, question_2)
# print(f"Answer 2: {answer_2}")
