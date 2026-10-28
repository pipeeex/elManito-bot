const baseUrl = (
    process.env.CANVAS_BASE_URL ?? "https://umb.instructure.com"
).replace(/\/+$/, "");


export type CanvasGrade = {
    assignment_id: number;
    assignment_name: string;
    score: number | null;
    points_possible: number | null;
    grade: string | null;
    course_id: number;
    course_name: string;
    html_url?: string;
    graded_at: string | null;
};

export type CanvasCourse = {
    id: number;
    name: string;
    course_code?: string;
    html_url?: string;
    current_grade: string | null;
    current_score: number | null;
};

export type PendingAssignment = {
    id: number;
    name: string;
    due_at: string | null;
    html_url?: string;
    course_id: number;
    course_name: string;
};

type CanvasAssignment = {
    id: number;
    name: string;
    due_at: string | null;
    html_url?: string;
    published?: boolean;
    submission?: {
        submitted_at?: string | null;
        workflow_state?: string;
    } | null;
};



export async function getCanvasCourses(
    token: string
): Promise<CanvasCourse[]> {
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
    };

    const coursesResponse = await fetch(
        `${baseUrl}/api/v1/courses?enrollment_state=active&enrollment_type=student&per_page=100`,
        {
            headers,
            signal: AbortSignal.timeout(15000)
        }
    );

    if (!coursesResponse.ok) {
        throw new Error(
            `Error consultando cursos: ${coursesResponse.status}`
        );
    }

    const courses = await coursesResponse.json() as {
        id: number;
        name: string;
        course_code?: string;
        html_url?: string;
    }[];

    return Promise.all(
        courses.map(async (course): Promise<CanvasCourse> => {
            const response = await fetch(
                `${baseUrl}/api/v1/courses/${course.id}/enrollments?user_id=self&type[]=StudentEnrollment&state[]=active&include[]=total_scores`,
                {
                    headers,
                    signal: AbortSignal.timeout(15000)
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Error consultando matrícula del curso ${course.id}: ${response.status}`
                );
            }

            const enrollments = await response.json() as {
                type?: string;
                grades?: {
                    current_grade?: string | null;
                    current_score?: number | null;
                    final_grade?: string | null;
                    final_score?: number | null;
                };
                computed_current_grade?: string | null;
                computed_current_score?: number | null;
            }[];

            const enrollment = enrollments.find(
                item => item.type === "StudentEnrollment"
            );

            return {
                ...course,
                current_grade:
                    enrollment?.grades?.current_grade ??
                    enrollment?.computed_current_grade ??
                    null,
                current_score:
                    enrollment?.grades?.current_score ??
                    enrollment?.computed_current_score ??
                    null
            };
        })
    );
}



export async function validateCanvasToken(
    token: string
): Promise<boolean> {
    const response = await fetch(
        `${baseUrl}/api/v1/courses?per_page=1`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            },
            signal: AbortSignal.timeout(10000)
        }
    );

    if (response.status === 401 || response.status === 403) {
        return false;
    }

    if (!response.ok) {
        throw new Error(`Canvas respondió con estado ${response.status}.`);
    }

    return true;
}

export async function getPendingAssignments(
    token: string
): Promise<PendingAssignment[]> {
    const baseUrl = (
        process.env.CANVAS_BASE_URL ?? "https://umb.instructure.com"
    ).replace(/\/+$/, "");

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
    };

    // Obtener los cursos activos del usuario
    const coursesResponse = await fetch(
        `${baseUrl}/api/v1/courses?enrollment_state=active&enrollment_type=student&per_page=100`,
        {
            headers,
            signal: AbortSignal.timeout(15000)
        }
    );

    if (!coursesResponse.ok) {
        throw new Error(`Canvas respondió con estado ${coursesResponse.status}`);
    }

    const courses = await coursesResponse.json() as {
        id: number;
        name: string;
    }[];

    // Consultar las tareas de cada curso
    const results = await Promise.all(
        courses.map(async course => {
            const response = await fetch(
                `${baseUrl}/api/v1/courses/${course.id}/assignments?include[]=submission&per_page=100`,
                {
                    headers,
                    signal: AbortSignal.timeout(15000)
                }
            );

            if (!response.ok) {
                throw new Error(
                    `No se pudieron consultar las tareas del curso ${course.id}`
                );
            }

            const assignments = await response.json() as CanvasAssignment[];

            return assignments
                .filter(assignment => {
                    const submission = assignment.submission;

                    return (
                        submission?.submitted_at == null &&
                        submission?.workflow_state !== "submitted" &&
                        submission?.workflow_state !== "graded"
                    );
                })
                .map(assignment => ({
                    id: assignment.id,
                    name: assignment.name,
                    due_at: assignment.due_at,
                    ...(assignment.html_url !== undefined
                        ? { html_url: assignment.html_url }
                        : {}),
                    course_id: course.id,
                    course_name: course.name
                }));
        })
    );

    return results
        .flat()
        .sort((a, b) => {
            // Las tareas con fecha aparecen primero
            if (!a.due_at && !b.due_at) return 0;
            if (!a.due_at) return 1;
            if (!b.due_at) return -1;

            return new Date(a.due_at).getTime()
                - new Date(b.due_at).getTime();
        });
}

export async function getCanvasGrades(
    token: string
): Promise<CanvasGrade[]> {
    const baseUrl = (
        process.env.CANVAS_BASE_URL ?? "https://umb.instructure.com"
    ).replace(/\/+$/, "");

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
    };

    const coursesResponse = await fetch(
        `${baseUrl}/api/v1/courses?enrollment_state=active&enrollment_type=student&per_page=100`,
        {
            headers,
            signal: AbortSignal.timeout(15000)
        }
    );

    if (!coursesResponse.ok) {
        throw new Error(
            `Error consultando cursos: ${coursesResponse.status}`
        );
    }

    const courses = await coursesResponse.json() as {
        id: number;
        name: string;
    }[];

    const results = await Promise.all(
        courses.map(async course => {
            const response = await fetch(
                `${baseUrl}/api/v1/courses/${course.id}/assignments?include[]=submission&per_page=100`,
                {
                    headers,
                    signal: AbortSignal.timeout(15000)
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Error consultando notas del curso ${course.id}: ${response.status}`
                );
            }

            const assignments = await response.json() as {
                id: number;
                name: string;
                html_url?: string;
                points_possible: number | null;
                submission?: {
                    score?: number | null;
                    grade?: string | null;
                    graded_at?: string | null;
                } | null;
            }[];

            return assignments
                .filter(assignment => {
                    const submission = assignment.submission;

                    return submission != null &&
                        (
                            submission.score != null ||
                            submission.grade != null
                        );
                })
                .map(assignment => ({
                    assignment_id: assignment.id,
                    assignment_name: assignment.name,
                    score: assignment.submission?.score ?? null,
                    points_possible: assignment.points_possible,
                    grade: assignment.submission?.grade ?? null,
                    course_id: course.id,
                    course_name: course.name,
                    graded_at: assignment.submission?.graded_at ?? null,
                    ...(assignment.html_url !== undefined
                        ? { html_url: assignment.html_url }
                        : {})
                }));
        })
    );

    return results
        .flat()
        .sort((a, b) => {
            const fechaA = a.graded_at
                ? new Date(a.graded_at).getTime()
                : 0;

            const fechaB = b.graded_at
                ? new Date(b.graded_at).getTime()
                : 0;

            return fechaB - fechaA;
        });
}



