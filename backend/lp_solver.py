from __future__ import annotations

import math
import time
from copy import deepcopy
from typing import Any, Literal


EPS = 1e-9
Method = Literal["auto", "graphic", "simplex", "dual"]


def eq(a: float, b: float) -> bool:
    return abs(a - b) < EPS


def rnd(n: float, digits: int = 6) -> float:
    factor = 10**digits
    return round(n * factor) / factor


def solve_2x2(
    a11: float,
    a12: float,
    b1: float,
    a21: float,
    a22: float,
    b2: float,
) -> list[float] | None:
    det = a11 * a22 - a12 * a21
    if abs(det) < EPS:
        return None
    x = (b1 * a22 - a12 * b2) / det
    y = (a11 * b2 - b1 * a21) / det
    return [rnd(x), rnd(y)]


def is_feasible(point: list[float], constraints: list[dict[str, Any]]) -> bool:
    if any(v < -EPS for v in point):
        return False
    for constraint in constraints:
        lhs = sum(coef * point[i] for i, coef in enumerate(constraint["coefficients"]))
        operator = constraint["operator"]
        rhs = constraint["rhs"]
        if operator == "<=" and lhs > rhs + EPS:
            return False
        if operator == ">=" and lhs < rhs - EPS:
            return False
        if operator == "=" and not eq(lhs, rhs):
            return False
    return True


def evaluate_z(point: list[float], coefficients: list[float]) -> float:
    return rnd(sum(value * coefficients[i] for i, value in enumerate(point)))


def vertex_label(index: int) -> str:
    return chr(65 + index)


def constraint_to_line(
    constraint: dict[str, Any],
    x_max: float,
    y_max: float,
) -> dict[str, Any]:
    a, b = constraint["coefficients"][:2]
    rhs = constraint["rhs"]
    x_intercept = rhs / a if abs(a) > EPS else None
    y_intercept = rhs / b if abs(b) > EPS else None
    points: list[list[float]] = []

    if abs(a) > EPS and abs(b) > EPS:
        candidates: list[list[float]] = []
        p1y = rhs / b
        if 0 <= p1y <= y_max * 1.2:
            candidates.append([0, p1y])

        p2x = rhs / a
        if 0 <= p2x <= x_max * 1.2:
            candidates.append([p2x, 0])

        y_at_x_max = (rhs - a * x_max * 1.2) / b
        if 0 <= y_at_x_max <= y_max * 1.2:
            candidates.append([x_max * 1.2, y_at_x_max])

        x_at_y_max = (rhs - b * y_max * 1.2) / a
        if 0 <= x_at_y_max <= x_max * 1.2:
            candidates.append([x_at_y_max, y_max * 1.2])

        if len(candidates) >= 2:
            candidates.sort(key=lambda item: (item[0], item[1]))
            points.extend([candidates[0], candidates[-1]])
        else:
            points.extend([[0, p1y], [p2x, 0]])
    elif abs(a) > EPS and abs(b) < EPS:
        xv = rhs / a
        points.extend([[xv, 0], [xv, y_max * 1.2]])
    elif abs(a) < EPS and abs(b) > EPS:
        yv = rhs / b
        points.extend([[0, yv], [x_max * 1.2, yv]])

    return {
        "constraint": constraint,
        "xIntercept": x_intercept,
        "yIntercept": y_intercept,
        "points": points,
    }


def compute_all_intersections(
    constraints: list[dict[str, Any]],
    with_axes: bool = True,
) -> list[dict[str, Any]]:
    intersections: list[dict[str, Any]] = []
    n = len(constraints)

    for i in range(n):
        for j in range(i + 1, n):
            c1 = constraints[i]
            c2 = constraints[j]
            if len(c1["coefficients"]) < 2 or len(c2["coefficients"]) < 2:
                continue
            solution = solve_2x2(
                c1["coefficients"][0],
                c1["coefficients"][1],
                c1["rhs"],
                c2["coefficients"][0],
                c2["coefficients"][1],
                c2["rhs"],
            )
            if solution:
                x, y = solution
                if x >= -EPS and y >= -EPS:
                    intersections.append(
                        {
                            "coordinates": [rnd(x), rnd(y)],
                            "constraintIds": [c1["id"], c2["id"]],
                            "isFeasible": False,
                        }
                    )

    if with_axes:
        for constraint in constraints:
            a, b = constraint["coefficients"][:2]
            if abs(b) > EPS:
                y = constraint["rhs"] / b
                if y >= -EPS:
                    intersections.append(
                        {
                            "coordinates": [0, rnd(y)],
                            "constraintIds": [constraint["id"], "x=0"],
                            "isFeasible": False,
                        }
                    )
            if abs(a) > EPS:
                x = constraint["rhs"] / a
                if x >= -EPS:
                    intersections.append(
                        {
                            "coordinates": [rnd(x), 0],
                            "constraintIds": [constraint["id"], "y=0"],
                            "isFeasible": False,
                        }
                    )
        intersections.append(
            {
                "coordinates": [0, 0],
                "constraintIds": ["x=0", "y=0"],
                "isFeasible": False,
            }
        )

    unique: list[dict[str, Any]] = []
    for point in intersections:
        exists = any(
            eq(item["coordinates"][0], point["coordinates"][0])
            and eq(item["coordinates"][1], point["coordinates"][1])
            for item in unique
        )
        if not exists:
            unique.append(point)
    return unique


def build_feasible_polygon(vertices: list[dict[str, Any]]) -> list[list[float]]:
    if len(vertices) < 3:
        return [list(vertex["coordinates"]) for vertex in vertices]

    cx = sum(vertex["coordinates"][0] for vertex in vertices) / len(vertices)
    cy = sum(vertex["coordinates"][1] for vertex in vertices) / len(vertices)
    sorted_vertices = sorted(
        vertices,
        key=lambda vertex: math.atan2(vertex["coordinates"][1] - cy, vertex["coordinates"][0] - cx),
    )
    polygon = [list(vertex["coordinates"]) for vertex in sorted_vertices]
    if polygon:
        polygon.append(list(polygon[0]))
    return polygon


def check_bounded(vertices: list[dict[str, Any]]) -> bool:
    max_coord = 0
    for vertex in vertices:
        max_coord = max(max_coord, abs(vertex["coordinates"][0]), abs(vertex["coordinates"][1]))
    return max_coord < 1e6


def solve_graphic(problem: dict[str, Any]) -> dict[str, Any]:
    objective = problem["objective"]
    constraints = problem["constraints"]

    if problem["numVariables"] != 2:
        raise ValueError("Graphical method requires exactly 2 variables")

    x_max = 0
    y_max = 0
    for constraint in constraints:
        coeffs = constraint["coefficients"]
        if abs(coeffs[0]) > EPS:
            x_max = max(x_max, constraint["rhs"] / coeffs[0])
        if abs(coeffs[1]) > EPS:
            y_max = max(y_max, constraint["rhs"] / coeffs[1])
    x_max = max(x_max, 10) * 1.2
    y_max = max(y_max, 10) * 1.2

    constraint_lines = [constraint_to_line(constraint, x_max, y_max) for constraint in constraints]
    intersections = compute_all_intersections(constraints)
    for point in intersections:
        point["isFeasible"] = is_feasible(point["coordinates"], constraints)

    all_constraints = [
        *constraints,
        {"id": "x=0", "coefficients": [1, 0], "operator": ">=", "rhs": 0, "label": "x1 >= 0"},
        {"id": "y=0", "coefficients": [0, 1], "operator": ">=", "rhs": 0, "label": "x2 >= 0"},
    ]
    feasible_points = [point for point in intersections if point["isFeasible"]]

    vertices: list[dict[str, Any]] = []
    for point in feasible_points:
        active_constraints: list[str] = []
        for constraint in all_constraints:
            lhs = sum(
                coef * point["coordinates"][i]
                for i, coef in enumerate(constraint["coefficients"])
            )
            if eq(lhs, constraint["rhs"]):
                active_constraints.append(constraint["id"])
        vertices.append(
            {
                "coordinates": point["coordinates"],
                "isFeasible": True,
                "zValue": evaluate_z(point["coordinates"], objective["coefficients"]),
                "label": "",
                "activeConstraints": active_constraints,
            }
        )

    center_x = sum(vertex["coordinates"][0] for vertex in vertices) / (len(vertices) or 1)
    center_y = sum(vertex["coordinates"][1] for vertex in vertices) / (len(vertices) or 1)
    vertices.sort(
        key=lambda vertex: math.atan2(
            vertex["coordinates"][1] - center_y,
            vertex["coordinates"][0] - center_x,
        )
    )
    for index, vertex in enumerate(vertices):
        vertex["label"] = vertex_label(index)

    optimal_vertex = None
    if vertices:
        if objective["type"] == "max":
            optimal_vertex = max(vertices, key=lambda vertex: vertex["zValue"])
        else:
            optimal_vertex = min(vertices, key=lambda vertex: vertex["zValue"])

    feasible_region = build_feasible_polygon(vertices)

    return {
        "vertices": vertices,
        "feasibleVertices": vertices,
        "optimalVertex": optimal_vertex,
        "feasibleRegion": feasible_region,
        "intersections": intersections,
        "constraintLines": constraint_lines,
        "isBounded": check_bounded(vertices),
        "zValues": [vertex["zValue"] for vertex in vertices],
    }


def to_standard_form(problem: dict[str, Any]) -> dict[str, Any]:
    constraints = problem["constraints"]
    num_variables = problem["numVariables"]
    num_slack = sum(1 for constraint in constraints if constraint["operator"] == "<=")

    variable_names = list(problem["variableNames"])
    slack_idx = 1
    for constraint in constraints:
        if constraint["operator"] == "<=":
            variable_names.append(f"e{slack_idx}")
            slack_idx += 1

    a_matrix: list[list[float]] = []
    b_vector: list[float] = []
    slack_var_index = num_variables
    for constraint in constraints:
        row = list(constraint["coefficients"])
        row.extend([0] * num_slack)
        if constraint["operator"] == "<=":
            row[slack_var_index] = 1
            slack_var_index += 1
        a_matrix.append(row)
        b_vector.append(constraint["rhs"])

    c_vector = list(problem["objective"]["coefficients"])
    c_vector.extend([0] * num_slack)

    return {
        "A": a_matrix,
        "b": b_vector,
        "c": c_vector,
        "numSlack": num_slack,
        "variableNames": variable_names,
    }


def extract_solution(tableau: list[list[float]], basic_variables: list[int], num_vars: int) -> list[float]:
    solution = [0] * num_vars
    for i, var_idx in enumerate(basic_variables):
        if var_idx < num_vars:
            solution[var_idx] = tableau[i + 1][num_vars]
    return solution


def solve_simplex(problem: dict[str, Any]) -> dict[str, Any]:
    objective = problem["objective"]
    standard = to_standard_form(problem)
    a_matrix = standard["A"]
    c_vector = standard["c"]
    variable_names = standard["variableNames"]
    num_constraints = len(a_matrix)
    total_vars = len(c_vector)

    basic_variables = []
    slack_idx = problem["numVariables"]
    for _ in range(num_constraints):
        basic_variables.append(slack_idx)
        slack_idx += 1

    non_basic_variables = list(range(problem["numVariables"]))

    tableau: list[list[float]] = []
    z_row = [(-coef if objective["type"] == "max" else coef) for coef in c_vector]
    z_row.append(0)
    tableau.append(z_row)
    for i in range(num_constraints):
        tableau.append([*a_matrix[i], standard["b"][i]])

    tableaux: list[dict[str, Any]] = []
    iteration = 0

    while True:
        z_row_current = tableau[0]
        is_optimal = all(value >= -EPS for value in z_row_current[:-1])
        solution = extract_solution(tableau, basic_variables, total_vars)
        z_value = tableau[0][total_vars] if objective["type"] == "max" else -tableau[0][total_vars]

        entering_var = None
        min_coeff = 0
        if not is_optimal:
            for j in range(total_vars):
                if z_row_current[j] < min_coeff - EPS:
                    min_coeff = z_row_current[j]
                    entering_var = j

        leaving_var = None
        pivot_row = None
        min_ratio = math.inf
        if entering_var is not None:
            for i in range(1, num_constraints + 1):
                coeff = tableau[i][entering_var]
                if coeff > EPS:
                    ratio = tableau[i][total_vars] / coeff
                    if ratio < min_ratio - EPS:
                        min_ratio = ratio
                        pivot_row = i
                        leaving_var = basic_variables[i - 1]

        if is_optimal:
            explanation = f"Optimalite atteinte. Z = {rnd(z_value)}"
        elif entering_var is not None and pivot_row is None:
            explanation = "Probleme non borne (pas de variable sortante)"
        else:
            explanation = f"Variable entrante: {variable_names[entering_var]} (coeff {rnd(z_row_current[entering_var])})"
            if leaving_var is not None:
                explanation += f" | Variable sortante: {variable_names[leaving_var]} (ratio min: {rnd(min_ratio)})"

        row_operations: list[str] = []
        if pivot_row is not None and entering_var is not None:
            pivot_value = tableau[pivot_row][entering_var]
            row_operations.append(f"L{pivot_row} = L{pivot_row} / {rnd(pivot_value)}")
            for i in range(num_constraints + 1):
                if i != pivot_row:
                    factor = tableau[i][entering_var]
                    if abs(factor) > EPS:
                        if factor < 0:
                            row_operations.append(f"L{i} = L{i} - ({rnd(factor)})*L{pivot_row}")
                        else:
                            row_operations.append(f"L{i} = L{i} - {rnd(factor)}*L{pivot_row}")

        tableaux.append(
            {
                "iteration": iteration,
                "matrix": [[rnd(value) for value in row] for row in tableau],
                "basicVariables": list(basic_variables),
                "nonBasicVariables": list(non_basic_variables),
                "enteringVariable": entering_var,
                "leavingVariable": leaving_var,
                "pivotRow": pivot_row,
                "pivotCol": entering_var,
                "pivotValue": rnd(tableau[pivot_row][entering_var])
                if pivot_row is not None and entering_var is not None
                else None,
                "zValue": rnd(z_value),
                "solution": [rnd(value) for value in solution],
                "isOptimal": is_optimal,
                "isUnbounded": entering_var is not None and pivot_row is None,
                "explanation": explanation,
                "rowOperations": row_operations,
                "variableNames": variable_names,
            }
        )

        if is_optimal:
            break
        if entering_var is not None and pivot_row is None:
            return {
                "tableaux": tableaux,
                "optimalSolution": [],
                "optimalValue": 1e308 if objective["type"] == "max" else -1e308,
                "numIterations": iteration,
                "status": "unbounded",
            }
        if iteration > 100:
            return {
                "tableaux": tableaux,
                "optimalSolution": solution,
                "optimalValue": z_value,
                "numIterations": iteration,
                "status": "infeasible",
            }

        pivot_value = tableau[pivot_row][entering_var]
        for j in range(total_vars + 1):
            tableau[pivot_row][j] /= pivot_value

        for i in range(num_constraints + 1):
            if i != pivot_row:
                factor = tableau[i][entering_var]
                if abs(factor) > EPS:
                    for j in range(total_vars + 1):
                        tableau[i][j] -= factor * tableau[pivot_row][j]

        basic_variables[pivot_row - 1] = entering_var
        basic_set = set(basic_variables)
        non_basic_variables = [j for j in range(total_vars) if j not in basic_set]
        iteration += 1

    final_solution = extract_solution(tableau, basic_variables, total_vars)
    final_z = tableau[0][total_vars] if objective["type"] == "max" else -tableau[0][total_vars]
    return {
        "tableaux": tableaux,
        "optimalSolution": [rnd(value) for value in final_solution],
        "optimalValue": rnd(final_z),
        "numIterations": iteration,
        "status": "optimal",
    }


def build_dual(problem: dict[str, Any]) -> dict[str, Any]:
    objective = problem["objective"]
    constraints = problem["constraints"]
    num_variables = problem["numVariables"]
    dual_type = "min" if objective["type"] == "max" else "max"
    dual_variable_names = [f"y{i + 1}" for i in range(len(constraints))]

    dual_constraints = []
    for j in range(num_variables):
        dual_constraints.append(
            {
                "id": f"dual_c{j + 1}",
                "coefficients": [constraint["coefficients"][j] for constraint in constraints],
                "operator": ">=",
                "rhs": objective["coefficients"][j],
                "label": f"Dual constraint {j + 1}",
            }
        )

    return {
        "objective": {
            "coefficients": [constraint["rhs"] for constraint in constraints],
            "type": dual_type,
        },
        "constraints": dual_constraints,
        "variableNames": dual_variable_names,
    }


def generate_interpretation(
    problem: dict[str, Any],
    shadow_prices: list[float],
    active_constraints: list[str],
) -> str:
    project_name = problem.get("projectName") or "ce probleme"
    objective_type = "maximisation" if problem["objective"]["type"] == "max" else "minimisation"
    active_labels = []
    for constraint_id in active_constraints:
        constraint = next((item for item in problem["constraints"] if item["id"] == constraint_id), None)
        if constraint:
            active_labels.append(constraint.get("label") or constraint_id)

    lines: list[str] = []
    lines.append("=== INTERPRETATION AUTOMATIQUE ===")
    lines.append("")
    lines.append(f"Contexte analyse: {project_name}.")
    lines.append(f"Objectif: {objective_type} de Z avec les contraintes saisies.")
    lines.append("")
    lines.append("Prix-ombres par contrainte:")
    for i, constraint in enumerate(problem["constraints"]):
        shadow_price = shadow_prices[i] if i < len(shadow_prices) else 0
        label = constraint.get("label") or f"Contrainte {i + 1}"
        lines.append(f"  {label}: {shadow_price:.2f}")
        if abs(shadow_price) > EPS:
            lines.append(
                f"    -> Si la limite de cette contrainte augmente de 1 unite, "
                f"la valeur de Z s'ameliore d'environ {shadow_price:.2f}."
            )
        else:
            lines.append("    -> Cette contrainte n'apporte pas de gain marginal direct autour de l'optimum.")
    lines.append("")
    lines.append("Contraintes actives (saturees):")
    if not active_labels:
        lines.append("  Aucune contrainte active.")
    else:
        for label in active_labels:
            lines.append(f"  * {label}")
    lines.append("")
    lines.append("Lecture generale:")
    lines.append("Les contraintes actives sont les limites qui bornent directement la solution optimale.")
    lines.append("Les prix-ombres mesurent l'effet marginal d'un assouplissement local de chaque limite.")
    lines.append("Une contrainte avec prix-ombre nul peut rester importante dans le modele, mais elle n'est pas prioritaire pour ameliorer Z au voisinage de la solution actuelle.")
    return "\n".join(lines)


def analyze_duality(problem: dict[str, Any], simplex_solution: dict[str, Any]) -> dict[str, Any]:
    dual = build_dual(problem)
    last_tableau = simplex_solution["tableaux"][-1]

    shadow_prices: list[float] = []
    for i in range(problem["numConstraints"]):
        slack_idx = problem["numVariables"] + i
        if slack_idx < len(last_tableau["matrix"][0]) - 1:
            shadow_prices.append(rnd(last_tableau["matrix"][0][slack_idx]))
        else:
            shadow_prices.append(0)

    reduced_costs = [rnd(last_tableau["matrix"][0][j]) for j in range(problem["numVariables"])]

    active_constraints: list[str] = []
    optimal_vertex = simplex_solution["optimalSolution"]
    for constraint in problem["constraints"]:
        lhs = sum(coef * optimal_vertex[i] for i, coef in enumerate(constraint["coefficients"]))
        if abs(lhs - constraint["rhs"]) < EPS:
            active_constraints.append(constraint["id"])

    dual_objective_value = sum(
        coef * abs(shadow_prices[i] if i < len(shadow_prices) else 0)
        for i, coef in enumerate(dual["objective"]["coefficients"])
    )
    strong_duality = abs(simplex_solution["optimalValue"] - dual_objective_value) < 1

    return {
        "primal": problem,
        "dual": dual,
        "shadowPrices": shadow_prices,
        "reducedCosts": reduced_costs,
        "activeConstraints": active_constraints,
        "interpretation": generate_interpretation(problem, shadow_prices, active_constraints),
        "weakDuality": dual_objective_value,
        "strongDuality": strong_duality,
    }


def detect_best_method(problem: dict[str, Any]) -> Literal["graphic", "simplex", "dual"]:
    if problem["numVariables"] == 2:
        return "graphic"
    if problem["objective"]["type"] == "min":
        return "dual"
    return "simplex"


def solve_complete(problem: dict[str, Any], method: Method = "auto") -> dict[str, Any]:
    started_at = time.perf_counter()
    normalized_problem = deepcopy(problem)
    selected_method = detect_best_method(normalized_problem) if method == "auto" else method

    graphic_solution = None
    simplex_solution = None
    duality_analysis = None

    try:
        simplex_solution = solve_simplex(normalized_problem)
    except Exception:
        simplex_solution = None

    if normalized_problem["numVariables"] == 2:
        try:
            graphic_solution = solve_graphic(normalized_problem)
        except Exception:
            graphic_solution = None

    if selected_method == "dual" or normalized_problem["objective"]["type"] == "min":
        if simplex_solution:
            duality_analysis = analyze_duality(normalized_problem, simplex_solution)

    if simplex_solution and simplex_solution["status"] == "optimal" and not duality_analysis:
        duality_analysis = analyze_duality(normalized_problem, simplex_solution)

    if simplex_solution:
        optimal_solution = simplex_solution["optimalSolution"]
        optimal_value = simplex_solution["optimalValue"]
        status = simplex_solution["status"]
    elif graphic_solution and graphic_solution["optimalVertex"]:
        optimal_solution = graphic_solution["optimalVertex"]["coordinates"]
        optimal_value = graphic_solution["optimalVertex"]["zValue"]
        status = "optimal"
    else:
        optimal_solution = []
        optimal_value = 0
        status = "infeasible"

    return {
        "problem": normalized_problem,
        "graphicSolution": graphic_solution,
        "simplexSolution": simplex_solution,
        "dualityAnalysis": duality_analysis,
        "method": selected_method,
        "optimalSolution": optimal_solution,
        "optimalValue": optimal_value,
        "status": status,
        "computationTime": rnd((time.perf_counter() - started_at) * 1000, 3),
    }
