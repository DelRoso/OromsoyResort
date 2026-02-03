from django.shortcuts import render, redirect
from .models import Review
from .forms import ReviewForm


def home(request):
    # 1) форма
    if request.method == "POST":
        form = ReviewForm(request.POST, request.FILES)
        if form.is_valid():
            obj = form.save(commit=False)

            # ВАЖНО: отправляем в модерацию
            # (название поля поправь под своё, см. ниже)
            if hasattr(obj, "approved"):
                obj.approved = False
            elif hasattr(obj, "is_approved"):
                obj.is_approved = False

            obj.save()
            return redirect("/#reviews")
    else:
        form = ReviewForm()

    # 2) отзывы для вывода (только одобренные)
    qs = Review.objects.all().order_by("-id")

    # фильтр по полю модерации — подстроил под 2 частых варианта
    if qs.model and any(f.name == "approved" for f in qs.model._meta.fields):
        qs = qs.filter(approved=True)
    elif qs.model and any(f.name == "is_approved" for f in qs.model._meta.fields):
        qs = qs.filter(is_approved=True)

    reviews_all = qs
    reviews_latest = qs[:2]  # последние 2

    return render(request, "site/index.html", {
        # НОВОЕ (для новой секции)
        "reviews_all": reviews_all,
        "reviews_latest": reviews_latest,

        # СТАРОЕ (чтобы ничего больше не отвалилось)
        "reviews": reviews_all,

        "review_form": form,
    })
