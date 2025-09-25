import io
import csv
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

from ..models.movie import Movie
from ..models.collection import Collection


class SharingService:
    """Service for generating shareable content and exports"""
    
    def __init__(self):
        self.social_media_dimensions = {
            'facebook': (1200, 630),
            'twitter': (1200, 675),
            'instagram': (1080, 1080),
            'linkedin': (1200, 627),
            'default': (1200, 630)
        }
    
    async def generate_catalog_image(
        self,
        collection: Collection,
        movies: List[Movie],
        format_type: str = 'default'
    ) -> bytes:
        """Generate a shareable catalog image"""
        
        # Get dimensions for the specified format
        width, height = self.social_media_dimensions.get(format_type, self.social_media_dimensions['default'])
        
        # Create image
        img = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to load fonts, fallback to default if not available
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
            subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
            movie_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
            footer_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
        except (OSError, IOError):
            # Fallback to default font
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            movie_font = ImageFont.load_default()
            footer_font = ImageFont.load_default()
        
        # Colors
        title_color = '#111827'
        subtitle_color = '#6b7280'
        movie_color = '#374151'
        footer_color = '#9ca3af'
        border_color = '#e5e7eb'
        
        # Layout calculations
        padding = 40
        header_height = 120
        footer_height = 60
        
        # Draw header
        title_text = f"{collection.name}"
        title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        draw.text(((width - title_width) // 2, 40), title_text, fill=title_color, font=title_font)
        
        subtitle_text = f"{len(movies)} Movies"
        subtitle_bbox = draw.textbbox((0, 0), subtitle_text, font=subtitle_font)
        subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
        draw.text(((width - subtitle_width) // 2, 90), subtitle_text, fill=subtitle_color, font=subtitle_font)
        
        # Calculate grid layout
        available_height = height - header_height - footer_height - (padding * 2)
        available_width = width - (padding * 2)
        
        # Determine grid dimensions based on number of movies
        if len(movies) <= 9:
            cols = 3
        elif len(movies) <= 16:
            cols = 4
        else:
            cols = 5
            
        rows = min(((len(movies) - 1) // cols) + 1, available_height // 40)  # Max rows based on available space
        
        cell_width = available_width // cols
        cell_height = 40
        
        # Sort movies alphabetically
        sorted_movies = sorted(movies, key=lambda m: m.title.lower())
        
        # Draw movies grid
        movies_to_show = sorted_movies[:rows * cols]  # Limit to what fits
        
        for i, movie in enumerate(movies_to_show):
            col = i % cols
            row = i // cols
            
            x = padding + (col * cell_width)
            y = header_height + padding + (row * cell_height) + 20
            
            # Truncate long titles
            title = movie.title
            if len(title) > 30:
                title = title[:27] + "..."
            
            draw.text((x + 10, y), title, fill=movie_color, font=movie_font)
            
            # Add separator line between columns
            if col < cols - 1:
                line_x = x + cell_width - 10
                draw.line([(line_x, y - 10), (line_x, y + 20)], fill=border_color, width=1)
        
        # Show "and X more..." if there are more movies
        if len(movies) > len(movies_to_show):
            remaining = len(movies) - len(movies_to_show)
            more_text = f"...and {remaining} more"
            more_y = header_height + padding + (rows * cell_height) + 30
            more_bbox = draw.textbbox((0, 0), more_text, font=movie_font)
            more_width = more_bbox[2] - more_bbox[0]
            draw.text(((width - more_width) // 2, more_y), more_text, fill=subtitle_color, font=movie_font)
        
        # Draw footer
        footer_text = "Created with Snap Your Shelf"
        footer_bbox = draw.textbbox((0, 0), footer_text, font=footer_font)
        footer_width = footer_bbox[2] - footer_bbox[0]
        draw.text(((width - footer_width) // 2, height - 40), footer_text, fill=footer_color, font=footer_font)
        
        # Add border
        draw.rectangle([1, 1, width - 2, height - 2], outline=border_color, width=2)
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG', quality=95)
        img_buffer.seek(0)
        
        return img_buffer.getvalue()
    
    async def export_collection_json(
        self,
        collection: Collection,
        movies: List[Movie]
    ) -> bytes:
        """Export collection data as JSON"""
        
        # Convert movies to dict format
        movies_data = []
        for movie in movies:
            movie_dict = {
                "id": str(movie.id),
                "title": movie.title,
                "release_year": movie.release_year,
                "genre": movie.genre,
                "director": movie.director,
                "runtime": movie.runtime,
                "rating": movie.rating,
                "imdb_rating": movie.imdb_rating,
                "studio": movie.studio,
                "format": movie.format,
                "language": movie.language,
                "cast": movie.cast,
                "plot": movie.plot,
                "awards": movie.awards,
                "box_office": movie.box_office,
                "country": movie.country,
                "poster_url": movie.poster_url,
                "personal_rating": movie.personal_rating,
                "notes": movie.notes,
                "tags": movie.tags,
                "spine_position": movie.spine_position,
                "added_at": movie.added_at.isoformat() if movie.added_at else None
            }
            movies_data.append(movie_dict)
        
        # Create export data
        export_data = {
            "collection": {
                "id": str(collection.id),
                "name": collection.name,
                "shelf_image_url": collection.shelf_image_url,
                "user_id": str(collection.user_id),
                "created_at": collection.created_at.isoformat() if collection.created_at else None,
                "updated_at": collection.updated_at.isoformat() if collection.updated_at else None
            },
            "movies": movies_data,
            "export_metadata": {
                "exported_at": datetime.utcnow().isoformat(),
                "total_movies": len(movies),
                "export_format": "json",
                "version": "1.0"
            }
        }
        
        # Convert to JSON bytes
        json_str = json.dumps(export_data, indent=2, ensure_ascii=False)
        return json_str.encode('utf-8')
    
    async def export_collection_csv(
        self,
        collection: Collection,
        movies: List[Movie]
    ) -> bytes:
        """Export collection data as CSV"""
        
        output = io.StringIO()
        
        # Define CSV headers
        headers = [
            'Title', 'Release Year', 'Genre', 'Director', 'Runtime (min)',
            'Rating', 'IMDB Rating', 'Studio', 'Format', 'Language',
            'Personal Rating', 'Notes', 'Tags', 'Added Date'
        ]
        
        writer = csv.writer(output)
        writer.writerow(headers)
        
        # Write movie data
        for movie in movies:
            row = [
                movie.title or '',
                movie.release_year or '',
                movie.genre or '',
                movie.director or '',
                movie.runtime or '',
                movie.rating or '',
                movie.imdb_rating or '',
                movie.studio or '',
                movie.format or '',
                movie.language or '',
                movie.personal_rating or '',
                movie.notes or '',
                ', '.join(movie.tags) if movie.tags else '',
                movie.added_at.strftime('%Y-%m-%d') if movie.added_at else ''
            ]
            writer.writerow(row)
        
        # Get CSV content as bytes
        csv_content = output.getvalue()
        output.close()
        
        return csv_content.encode('utf-8')
    
    def _wrap_text(self, text: str, max_width: int, font, draw) -> List[str]:
        """Helper method to wrap text to fit within specified width"""
        words = text.split(' ')
        lines = []
        current_line = ''
        
        for word in words:
            test_line = current_line + (' ' if current_line else '') + word
            bbox = draw.textbbox((0, 0), test_line, font=font)
            text_width = bbox[2] - bbox[0]
            
            if text_width <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                    current_line = word
                else:
                    # Single word is too long, truncate it
                    lines.append(word[:20] + '...' if len(word) > 20 else word)
                    current_line = ''
        
        if current_line:
            lines.append(current_line)
        
        return lines
    
    def get_supported_formats(self) -> List[str]:
        """Get list of supported sharing formats"""
        return list(self.social_media_dimensions.keys())
    
    def get_supported_export_formats(self) -> List[str]:
        """Get list of supported export formats"""
        return ['json', 'csv']