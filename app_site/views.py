from django.shortcuts import render, redirect
from django.contrib import messages

from .models import Review
from .forms import ReviewForm

def home(request):
    # все одобренные
    reviews = Review.objects.filter(approved=True)[:12]

    if request.method == "POST":
        form = ReviewForm(request.POST, request.FILES)
        if form.is_valid():
            review = form.save(commit=False)
            review.approved = False
            review.save()
            messages.success(request, "Спасибо! Отзыв отправлен на модерацию.")
            return redirect("home")  # или якорь #reviews (ниже покажу)
        else:
            messages.error(request, "Проверь форму: есть ошибки.")
    else:
        form = ReviewForm()

    return render(request, "site/index.html", {
        "reviews": reviews,
        "review_form": form,
    })
