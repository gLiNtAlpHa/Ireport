import os
import uuid
import aiofiles
import mimetypes
from typing import Optional, List, Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image
import hashlib
from pathlib import Path
from ..core.config import settings

# Configuration
ALLOWED_IMAGE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
}

ALLOWED_DOCUMENT_TYPES = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
}

ALLOWED_EXTENSIONS = [ext for exts in ALLOWED_IMAGE_TYPES.values() for ext in exts] + \
                    [ext for exts in ALLOWED_DOCUMENT_TYPES.values() for ext in exts]

MAX_FILE_SIZE = settings.MAX_FILE_SIZE  # 5MB
MAX_IMAGE_DIMENSION = 2048  # pixels

# Create upload directories
UPLOAD_BASE_DIR = settings.UPLOAD_FOLDER
UPLOAD_DIRS = {
    'profile_images': 'profile_images',
    'incident_images': 'incident_images',
    'documents': 'documents',
    'general': 'general'
}

def create_upload_directories():
    """Create all necessary upload directories"""
    for folder_name in UPLOAD_DIRS.values():
        dir_path = os.path.join(UPLOAD_BASE_DIR, folder_name)
        os.makedirs(dir_path, exist_ok=True)

# Ensure directories exist
create_upload_directories()

def validate_file(file: UploadFile, file_type: str = "image") -> bool:
    """
    Validate uploaded file for type, size, and security
    
    Args:
        file: FastAPI UploadFile object
        file_type: Type of file to validate ('image', 'document', 'any')
    
    Returns:
        bool: True if file is valid
    
    Raises:
        HTTPException: If file validation fails
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    # Get file extension
    filename = file.filename or ""
    file_ext = os.path.splitext(filename)[1].lower()
    
    if not file_ext:
        raise HTTPException(status_code=400, detail="File must have an extension")
    
    # Validate file type
    content_type = file.content_type or ""
    
    if file_type == "image":
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid image type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES.keys())}"
            )
        
        if file_ext not in ALLOWED_IMAGE_TYPES.get(content_type, []):
            raise HTTPException(
                status_code=400, 
                detail="File extension doesn't match content type"
            )
    
    elif file_type == "document":
        if content_type not in ALLOWED_DOCUMENT_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid document type. Allowed types: {', '.join(ALLOWED_DOCUMENT_TYPES.keys())}"
            )
    
    elif file_type == "any":
        all_allowed_types = {**ALLOWED_IMAGE_TYPES, **ALLOWED_DOCUMENT_TYPES}
        if content_type not in all_allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="File type not allowed"
            )
    
    # Additional security checks
    if not _is_safe_filename(filename):
        raise HTTPException(
            status_code=400, 
            detail="Invalid filename"
        )
    
    return True

def _is_safe_filename(filename: str) -> bool:
    """Check if filename is safe (no path traversal, etc.)"""
    if not filename:
        return False
    
    # Check for path traversal attempts
    if ".." in filename or "/" in filename or "\\" in filename:
        return False
    
    # Check for hidden files
    if filename.startswith('.'):
        return False
    
    # Check filename length
    if len(filename) > 255:
        return False
    
    return True

def generate_unique_filename(original_filename: str, prefix: str = "") -> str:
    """
    Generate a unique filename while preserving the extension
    
    Args:
        original_filename: Original filename
        prefix: Optional prefix for the filename
    
    Returns:
        str: Unique filename
    """
    # Get file extension
    _, ext = os.path.splitext(original_filename)
    ext = ext.lower()
    
    # Generate unique identifier
    unique_id = str(uuid.uuid4())
    
    # Create timestamp for better organization
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d")
    
    # Combine prefix, timestamp, and unique ID
    if prefix:
        filename = f"{prefix}_{timestamp}_{unique_id}{ext}"
    else:
        filename = f"{timestamp}_{unique_id}{ext}"
    
    return filename

async def save_uploaded_file(
    file: UploadFile, 
    folder: str = "general",
    file_type: str = "image",
    prefix: str = "",
    resize_image: bool = True
) -> str:
    """
    Save uploaded file to disk with validation and processing
    
    Args:
        file: FastAPI UploadFile object
        folder: Subfolder to save the file in
        file_type: Type of file ('image', 'document', 'any')
        prefix: Optional prefix for filename
        resize_image: Whether to resize images
    
    Returns:
        str: Relative path to saved file
    
    Raises:
        HTTPException: If file saving fails
    """
    try:
        # Validate file
        validate_file(file, file_type)
        
        # Get folder path
        if folder not in UPLOAD_DIRS:
            folder = "general"
        
        folder_path = os.path.join(UPLOAD_BASE_DIR, UPLOAD_DIRS[folder])
        os.makedirs(folder_path, exist_ok=True)
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename, prefix) # type: ignore
        file_path = os.path.join(folder_path, unique_filename)
        
        # Read file content
        content = await file.read()
        
        # Validate file size after reading
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Process image files
        if file_type == "image" and resize_image:
            content = await _process_image(content, file.content_type) # type: ignore
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Return relative path
        relative_path = os.path.join(UPLOAD_DIRS[folder], unique_filename)
        return relative_path.replace('\\', '/')  # Ensure forward slashes for URLs
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to save file: {str(e)}"
        )
    finally:
        # Reset file position for any subsequent reads
        await file.seek(0)

async def _process_image(content: bytes, content_type: str) -> bytes:
    """
    Process image: resize, optimize, and validate
    
    Args:
        content: Image content as bytes
        content_type: MIME type of the image
    
    Returns:
        bytes: Processed image content
    """
    try:
        # Open image with PIL
        image = Image.open(io.BytesIO(content)) # type: ignore
        
        # Validate image
        image.verify()
        
        # Reopen for processing (verify() closes the image)
        image = Image.open(io.BytesIO(content)) # type: ignore
        
        # Convert RGBA to RGB if necessary (for JPEG)
        if content_type == 'image/jpeg' and image.mode in ('RGBA', 'P'):
            # Create white background
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # Resize if too large
        if image.width > MAX_IMAGE_DIMENSION or image.height > MAX_IMAGE_DIMENSION:
            image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
        
        # Save processed image
        import io
        output = io.BytesIO()
        
        # Determine format and quality
        if content_type == 'image/jpeg':
            image.save(output, format='JPEG', quality=85, optimize=True)
        elif content_type == 'image/png':
            image.save(output, format='PNG', optimize=True)
        elif content_type == 'image/webp':
            image.save(output, format='WEBP', quality=85, optimize=True)
        else:
            image.save(output, format=image.format or 'JPEG', quality=85, optimize=True)
        
        return output.getvalue()
        
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid image file: {str(e)}"
        )

def delete_file(file_path: str) -> bool:
    """
    Delete a file from the upload directory
    
    Args:
        file_path: Relative path to the file
    
    Returns:
        bool: True if file was deleted successfully
    """
    try:
        full_path = os.path.join(UPLOAD_BASE_DIR, file_path)
        
        # Security check: ensure file is within upload directory
        if not os.path.abspath(full_path).startswith(os.path.abspath(UPLOAD_BASE_DIR)):
            return False
        
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        
        return False
        
    except Exception:
        return False

def get_file_info(file_path: str) -> Optional[dict]:
    """
    Get information about a file
    
    Args:
        file_path: Relative path to the file
    
    Returns:
        dict: File information or None if file doesn't exist
    """
    try:
        full_path = os.path.join(UPLOAD_BASE_DIR, file_path)
        
        # Security check
        if not os.path.abspath(full_path).startswith(os.path.abspath(UPLOAD_BASE_DIR)):
            return None
        
        if not os.path.exists(full_path):
            return None
        
        stat = os.stat(full_path)
        
        return {
            'filename': os.path.basename(file_path),
            'size': stat.st_size,
            'created_at': stat.st_ctime,
            'modified_at': stat.st_mtime,
            'mime_type': mimetypes.guess_type(full_path)[0]
        }
        
    except Exception:
        return None

def cleanup_old_files(days: int = 30) -> int:
    """
    Clean up files older than specified days
    
    Args:
        days: Number of days after which files are considered old
    
    Returns:
        int: Number of files deleted
    """
    import time
    
    deleted_count = 0
    cutoff_time = time.time() - (days * 24 * 60 * 60)
    
    try:
        for root, dirs, files in os.walk(UPLOAD_BASE_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                
                # Skip if file is recent
                if os.path.getctime(file_path) > cutoff_time:
                    continue
                
                # Delete old file
                try:
                    os.remove(file_path)
                    deleted_count += 1
                except Exception:
                    continue
        
        return deleted_count
        
    except Exception:
        return deleted_count

def get_file_hash(content: bytes) -> str:
    """
    Generate SHA-256 hash of file content
    
    Args:
        content: File content as bytes
    
    Returns:
        str: SHA-256 hash
    """
    return hashlib.sha256(content).hexdigest()

async def validate_and_save_multiple_files(
    files: List[UploadFile],
    folder: str = "general",
    file_type: str = "image",
    max_files: int = 5
) -> List[str]:
    """
    Validate and save multiple files
    
    Args:
        files: List of UploadFile objects
        folder: Subfolder to save files
        file_type: Type of files
        max_files: Maximum number of files allowed
    
    Returns:
        List[str]: List of saved file paths
    """
    if len(files) > max_files:
        raise HTTPException(
            status_code=400, 
            detail=f"Maximum {max_files} files allowed"
        )
    
    saved_files = []
    
    try:
        for i, file in enumerate(files):
            file_path = await save_uploaded_file(
                file, 
                folder=folder, 
                file_type=file_type,
                prefix=f"batch_{i}"
            )
            saved_files.append(file_path)
        
        return saved_files
        
    except Exception as e:
        # Clean up any files that were saved before the error
        for file_path in saved_files:
            delete_file(file_path)
        raise e


def create_thumbnail(
    image_path: str, 
    thumbnail_size: Tuple[int, int] = (150, 150)
) -> Optional[str]:
    """
    Create thumbnail for an image
    
    Args:
        image_path: Path to the original image
        thumbnail_size: Size of thumbnail (width, height)
    
    Returns:
        str: Path to thumbnail or None if failed
    """
    try:
        full_path = os.path.join(UPLOAD_BASE_DIR, image_path)
        
        if not os.path.exists(full_path):
            return None
        
        # Open image
        image = Image.open(full_path)
        
        # Create thumbnail
        image.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
        
        # Generate thumbnail filename
        path_parts = os.path.splitext(image_path)
        thumbnail_path = f"{path_parts[0]}_thumb{path_parts[1]}"
        thumbnail_full_path = os.path.join(UPLOAD_BASE_DIR, thumbnail_path)
        
        # Save thumbnail
        image.save(thumbnail_full_path, optimize=True, quality=85)
        
        return thumbnail_path.replace('\\', '/')
        
    except Exception:
        return None

def get_image_dimensions(image_path: str) -> Optional[Tuple[int, int]]:
    """
    Get dimensions of an image
    
    Args:
        image_path: Path to the image
    
    Returns:
        Tuple[int, int]: (width, height) or None if failed
    """
    try:
        full_path = os.path.join(UPLOAD_BASE_DIR, image_path)
        
        if not os.path.exists(full_path):
            return None
        
        with Image.open(full_path) as image:
            return image.size
            
    except Exception:
        return None

def compress_image(
    image_path: str, 
    quality: int = 75,
    max_width: int = 1024
) -> bool:
    """
    Compress an existing image
    
    Args:
        image_path: Path to the image
        quality: JPEG quality (1-100)
        max_width: Maximum width for resizing
    
    Returns:
        bool: True if compression succeeded
    """
    try:
        full_path = os.path.join(UPLOAD_BASE_DIR, image_path)
        
        if not os.path.exists(full_path):
            return False
        
        # Open and process image
        with Image.open(full_path) as image:
            # Resize if too wide
            if image.width > max_width:
                ratio = max_width / image.width
                new_height = int(image.height * ratio)
                image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Save compressed
            image.save(full_path, optimize=True, quality=quality)
        
        return True
        
    except Exception:
        return False

async def convert_image_format(
    image_path: str, 
    target_format: str = "JPEG"
) -> Optional[str]:
    """
    Convert image to different format
    
    Args:
        image_path: Path to the original image
        target_format: Target format (JPEG, PNG, WEBP)
    
    Returns:
        str: Path to converted image or None if failed
    """
    try:
        full_path = os.path.join(UPLOAD_BASE_DIR, image_path)
        
        if not os.path.exists(full_path):
            return None
        
        # Determine new extension
        ext_map = {
            'JPEG': '.jpg',
            'PNG': '.png',
            'WEBP': '.webp'
        }
        
        if target_format not in ext_map:
            return None
        
        # Generate new filename
        path_parts = os.path.splitext(image_path)
        new_path = f"{path_parts[0]}_converted{ext_map[target_format]}"
        new_full_path = os.path.join(UPLOAD_BASE_DIR, new_path)
        
        # Convert image
        with Image.open(full_path) as image:
            # Handle transparency for JPEG
            if target_format == 'JPEG' and image.mode in ('RGBA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            
            # Save in new format
            image.save(new_full_path, format=target_format, optimize=True, quality=85)
        
        return new_path.replace('\\', '/')
        
    except Exception:
        return None

