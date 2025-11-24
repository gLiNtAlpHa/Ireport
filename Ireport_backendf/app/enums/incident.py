import enum

class IncidentCategory(enum.Enum):
    DAMAGES = "damages"
    LOST_AND_FOUND = "lost_and_found"
    ACCIDENTS = "accidents"
    ENVIRONMENTAL_HAZARDS = "environmental_hazards"
    NOTICES_SUGGESTIONS = "notices_suggestions"
    COMPLAINTS = "complaints"

class IncidentStatus(enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    ARCHIVED = "archived"
    FLAGGED = "flagged"


