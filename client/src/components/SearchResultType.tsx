const TypeColors = {
    "Video": "#FF3B30",
    "Image": "#34C759",
    "Audio": "#007AFF",
    "Text": "#8E8E93",
    "Compressed": "#FF9500",
    "Unknown": "#5856D6"
} as { [type: string]: string };

export function SearchResultType({ type }: { type: string }) {
    return (
        <div className="rounded-lg px-2 font-bold" style={{
            backgroundColor: TypeColors[type]
        }}>
            {type.toLowerCase()}
        </div>
    )
}