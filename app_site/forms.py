from django import forms
from .models import Review

class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ("full_name", "short_title", "text", "photo")
        widgets = {
            "full_name": forms.TextInput(attrs={"placeholder": "ФИО"}),
            "short_title": forms.TextInput(attrs={"placeholder": "Коротко (например: “Лучший отдых!”)"}),
            "text": forms.Textarea(attrs={"placeholder": "Напишите подробный отзыв...", "rows": 5}),
        }
