from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from ..routes.auth import get_current_user
from ..utils.file_upload import save_uploaded_file, validate_file
from ..models.user import User
import os

router = APIRouter(prefix="/files", tags=["Files"])

@router.post("/upload", response_model=dict)
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "general",
    current_user: User = Depends(get_current_user)
):
    """Upload a file"""
    # Validate file
    if not validate_file(file):
        raise HTTPException(status_code=400, detail="Invalid file type or size")
    
    file_path = await save_uploaded_file(file, folder=folder)
    
    return {
        "message": "File uploaded successfully",
        "file_path": file_path,
        "file_name": file.filename
    }

@router.get("/download/{file_path:path}")
async def download_file(
    file_path: str,
    current_user: User = Depends(get_current_user)
):
    """Download a file"""
    full_path = os.path.join("uploads", file_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=full_path,
        filename=os.path.basename(file_path),
        media_type='application/octet-stream'
    )