from django.db import models

class Review(models.Model):
    full_name = models.CharField("ФИО", max_length=120)
    short_title = models.CharField("Краткое описание", max_length=120)
    text = models.TextField("Подробный отзыв", max_length=2000)
    photo = models.ImageField("Фото (аватар)", upload_to="reviews/", blank=True, null=True)

    approved = models.BooleanField("Одобрен", default=False)
    created_at = models.DateTimeField("Создан", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"

    def __str__(self):
        return f"{self.full_name} ({'OK' if self.approved else 'PENDING'})"
