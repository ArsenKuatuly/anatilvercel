function pickPayload(x) {
    // authFetch может вернуть Response или {res,data}
    if (!x) return { ok: false, data: null };

    // формат: { res: Response, data: parsedJson }
    if (x.data !== undefined) return { ok: !!x.res?.ok, data: x.data };

    // формат: Response
    return { ok: !!x.ok, data: null };
}

async function toJson(x) {
    // если это Response
    if (x && typeof x.json === "function") {
        try { return await x.json(); } catch { return null; }
    }
    // если это уже объект
    if (x && typeof x === "object") return x;
    return null;
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const out = await authFetch("/api/lessons/progress/current");
        const payload = pickPayload(out);

        const data = await toJson(payload.data ?? out);
        if (!data?.success) return;

        const percentEl = document.getElementById("lessonPercent");
        const courseTitleEl = document.getElementById("courseTitle");
        const courseDescEl = document.getElementById("courseDesc");
        const lastLessonEl = document.getElementById("lastLesson");
        const nextLessonEl = document.getElementById("nextLesson");
        const goBtn = document.getElementById("goToCourseBtn");

        if (percentEl) percentEl.textContent = `${Number(data.percent || 0)}%`;
        if (courseTitleEl) courseTitleEl.textContent = data.course?.title || "Ваш текущий курс";
        if (courseDescEl) courseDescEl.textContent = "Продолжайте обучение";

        if (lastLessonEl) lastLessonEl.textContent = data.lastLesson ? data.lastLesson.title : "—";
        if (nextLessonEl) nextLessonEl.textContent = data.nextLesson ? data.nextLesson.title : "Все уроки пройдены";

        if (goBtn) {
            const slug = data.course?.slug;
            goBtn.href = slug ? `/courses/${slug}` : "#";
        }
    } catch (err) {
        console.error("Ошибка загрузки прогресса", err);
    }
});
