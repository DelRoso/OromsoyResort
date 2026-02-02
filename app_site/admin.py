from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("full_name", "short_title", "approved", "created_at")
    list_filter = ("approved", "created_at")
    search_fields = ("full_name", "short_title", "text")
    actions = ("approve_reviews",)

    @admin.action(description="Approve выбранные отзывы")
    def approve_reviews(self, request, queryset):
        queryset.update(approved=True)
