import enum

class ReactionType(enum.Enum):
    LIKE = "like"
    HELPFUL = "helpful"
    CONCERNED = "concerned"
    RESOLVED = "resolved"