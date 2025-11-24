from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .core.database import engine, Base
from .routes import auth, incidents, users, admin, files

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Student iReport API",
    description="API for student incident reporting system",
    version="1.0.0"
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Include routers
app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(users.router)
app.include_router(files.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "Student iReport API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
