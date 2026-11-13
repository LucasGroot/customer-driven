"""
The shape of one analysis run as the dashboard reads it. These models mirror
frontend/src/domain/types.ts, so a field added there has to be added here too.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelCaseModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RoutineDocument(CamelCaseModel):
    code: str
    name: str
    uploaded_label: str


class RoutineCandidate(CamelCaseModel):
    document_code: str
    score: float


class AskedQuestion(CamelCaseModel):
    id: str
    text: str
    reference: str
    category: str
    document_code: str
    coverage: float
    needs_review: bool
    group_id: str | None = None
    routine_cluster_id: str | None = None
    # Best match first. Empty in a snapshot made before candidates were stored.
    candidates: list[RoutineCandidate] = []


class ReviewGroup(CamelCaseModel):
    id: str
    title: str
    heading_question_id: str


class RoutineCluster(CamelCaseModel):
    id: str
    routine_code: str
    title: str
    heading_question_id: str


class DataSource(CamelCaseModel):
    name: str
    count: int
    unit: str
    uploaded_label: str


class AnalysisSnapshot(CamelCaseModel):
    is_example: bool
    document_owners: list[str]
    last_run_label: str
    questions: list[AskedQuestion]
    review_groups: list[ReviewGroup]
    routine_clusters: list[RoutineCluster]
    documents: list[RoutineDocument]
    sources: list[DataSource]


def snapshot_to_json_dict(snapshot):
    """
    Turns a snapshot into the camelCase dict the frontend expects. Fields that
    are None are left out, because the frontend checks `groupId !== undefined`
    and would read a null as a real group.
    """

    return snapshot.model_dump(by_alias=True, exclude_none=True)
