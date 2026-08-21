from datetime import datetime, timedelta
from typing import Optional

from schemas import (
    DriverInput,
    RecommendationItem,
    RecommendationResult,
)


WORK_START_HOUR = 8
WORK_END_HOUR = 18


def calculate_workload_minutes(driver: DriverInput) -> int:
    total = 0

    for schedule in driver.schedules:
        duration = (
            schedule.endTime
            - schedule.startTime
        )

        total += int(
            duration.total_seconds()
            / 60
        )

    return total


def find_available_slot(
    date: datetime,
    driver: DriverInput,
    duration_minutes: int,
) -> Optional[tuple[datetime, datetime]]:
    start_of_day = date.replace(
        hour=WORK_START_HOUR,
        minute=0,
        second=0,
        microsecond=0,
    )

    end_of_day = date.replace(
        hour=WORK_END_HOUR,
        minute=0,
        second=0,
        microsecond=0,
    )

    schedules = sorted(
        driver.schedules,
        key=lambda schedule:
            schedule.startTime,
    )

    candidate_start = start_of_day

    for schedule in schedules:
        candidate_end = (
            candidate_start
            + timedelta(
                minutes=duration_minutes
            )
        )

        if (
            candidate_end
            <= schedule.startTime
        ):
            return (
                candidate_start,
                candidate_end,
            )

        if (
            schedule.endTime
            > candidate_start
        ):
            candidate_start = (
                schedule.endTime
            )

    candidate_end = (
        candidate_start
        + timedelta(
            minutes=duration_minutes
        )
    )

    if candidate_end <= end_of_day:
        return (
            candidate_start,
            candidate_end,
        )

    return None


def calculate_scores(
    workload_minutes: int,
    slot_start: datetime,
    day_start: datetime,
) -> tuple[float, float, float]:
    workload_score = max(
        0,
        100 - workload_minutes / 5
    )

    minutes_from_start = (
        slot_start - day_start
    ).total_seconds() / 60

    availability_score = max(
        0,
        100 - minutes_from_start / 6
    )

    final_score = (
        workload_score * 0.6
        + availability_score * 0.4
    )

    return (
        round(workload_score, 2),
        round(availability_score, 2),
        round(final_score, 2),
    )


def recommend_best_slot(
    date: datetime,
    duration_minutes: int,
    drivers: list[DriverInput],
) -> Optional[RecommendationResult]:
    recommendations = []

    day_start = date.replace(
        hour=WORK_START_HOUR,
        minute=0,
        second=0,
        microsecond=0,
    )

    for driver in drivers:
        slot = find_available_slot(
            date=date,
            driver=driver,
            duration_minutes=
                duration_minutes,
        )

        if slot is None:
            continue

        start_time, end_time = slot

        workload_minutes = (
            calculate_workload_minutes(
                driver
            )
        )

        (
            workload_score,
            availability_score,
            final_score,
        ) = calculate_scores(
            workload_minutes,
            start_time,
            day_start,
        )

        item = RecommendationItem(
            assignedTo=driver.id,
            assigneeName=driver.name,

            startTime=start_time,
            endTime=end_time,

            durationMinutes=
                duration_minutes,

            taskCount=
                len(driver.schedules),

            workloadMinutes=
                workload_minutes,

            workloadScore=
                workload_score,

            availabilityScore=
                availability_score,

            score=
                final_score,

            reason=(
                f"{driver.name} memiliki "
                f"{len(driver.schedules)} task, "
                f"workload {workload_minutes} menit, "
                "dan slot tersedia tanpa konflik."
            ),
        )

        recommendations.append(
            item
        )

    if not recommendations:
        return None

    recommendations.sort(
        key=lambda recommendation:
            recommendation.score,
        reverse=True,
    )

    return RecommendationResult(
        best=recommendations[0],
        alternatives=
            recommendations[1:4],
    )