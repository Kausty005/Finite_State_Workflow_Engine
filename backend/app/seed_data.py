"""
FlowState - Default Pre-Seeded Workflows & Templates
Provides fully operational workflows ready immediately upon installation.
"""
import json
from typing import List, Dict, Any

SEED_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "tpl-ecommerce-order",
        "name": "E-Commerce Order Processing",
        "description": "Standard retail order fulfillment automaton handling checkout, payment verification, warehousing, shipping, and cancellation branch.",
        "category": "E-Commerce",
        "is_template": True,
        "nodes": [
            {
                "id": "q0",
                "type": "initialNode",
                "position": {"x": 80, "y": 200},
                "data": {
                    "id": "q0",
                    "label": "Order Placed",
                    "type": "initial",
                    "description": "Customer placed order and checked out cart",
                    "action": "Notify Cart Service"
                }
            },
            {
                "id": "q1",
                "type": "normalNode",
                "position": {"x": 340, "y": 200},
                "data": {
                    "id": "q1",
                    "label": "Payment Pending",
                    "type": "normal",
                    "description": "Awaiting payment webhook confirmation from gateway",
                    "action": "Hold Inventory Lock"
                }
            },
            {
                "id": "q2",
                "type": "conditionalNode",
                "position": {"x": 620, "y": 120},
                "data": {
                    "id": "q2",
                    "label": "Payment Successful",
                    "type": "conditional",
                    "description": "Payment confirmed via 3D Secure / Stripe webhook",
                    "action": "Issue Tax Invoice"
                }
            },
            {
                "id": "q3",
                "type": "normalNode",
                "position": {"x": 900, "y": 120},
                "data": {
                    "id": "q3",
                    "label": "Order Processing",
                    "type": "normal",
                    "description": "Fulfillment center picking and packing goods",
                    "action": "Generate Waybill Barcode"
                }
            },
            {
                "id": "q4",
                "type": "normalNode",
                "position": {"x": 1180, "y": 120},
                "data": {
                    "id": "q4",
                    "label": "Shipped",
                    "type": "normal",
                    "description": "Package handed over to carrier dispatch",
                    "action": "Send Tracking SMS"
                }
            },
            {
                "id": "q5",
                "type": "finalNode",
                "position": {"x": 1460, "y": 120},
                "data": {
                    "id": "q5",
                    "label": "Delivered",
                    "type": "final",
                    "description": "Delivery successfully completed with recipient signature",
                    "action": "Release Payout to Vendor"
                }
            },
            {
                "id": "q6",
                "type": "conditionalNode",
                "position": {"x": 620, "y": 360},
                "data": {
                    "id": "q6",
                    "label": "Payment Failed",
                    "type": "conditional",
                    "description": "Payment authorization timed out or declined",
                    "action": "Send Failure Retry Link"
                }
            },
            {
                "id": "q7",
                "type": "finalNode",
                "position": {"x": 980, "y": 360},
                "data": {
                    "id": "q7",
                    "label": "Order Cancelled",
                    "type": "final",
                    "description": "Order aborted, inventory returned to pool",
                    "action": "Log Cancellation Audit"
                }
            }
        ],
        "edges": [
            {
                "id": "e_q0_q1",
                "source": "q0",
                "target": "q1",
                "animated": True,
                "data": {
                    "event": "CHECKOUT",
                    "condition": "Cart items in stock",
                    "action": "Init Payment Session"
                }
            },
            {
                "id": "e_q1_q2",
                "source": "q1",
                "target": "q2",
                "animated": True,
                "data": {
                    "event": "PAY_SUCCESS",
                    "condition": "HTTP 200 Gateway Callback",
                    "action": "Capture Funds"
                }
            },
            {
                "id": "e_q1_q6",
                "source": "q1",
                "target": "q6",
                "animated": True,
                "data": {
                    "event": "PAY_FAIL",
                    "condition": "Gateway decline or timeout",
                    "action": "Record Transaction Error"
                }
            },
            {
                "id": "e_q2_q3",
                "source": "q2",
                "target": "q3",
                "animated": True,
                "data": {
                    "event": "PACK_ORDER",
                    "condition": "Warehouse bin allocated",
                    "action": "Dispatch to Packers"
                }
            },
            {
                "id": "e_q3_q4",
                "source": "q3",
                "target": "q4",
                "animated": True,
                "data": {
                    "event": "DISPATCH",
                    "condition": "Carrier scan verified",
                    "action": "Update Tracking Info"
                }
            },
            {
                "id": "e_q4_q5",
                "source": "q4",
                "target": "q5",
                "animated": True,
                "data": {
                    "event": "CONFIRM_DELIVERY",
                    "condition": "Customer OTP signed",
                    "action": "Close Order Cycle"
                }
            },
            {
                "id": "e_q6_q7",
                "source": "q6",
                "target": "q7",
                "animated": True,
                "data": {
                    "event": "ABORT_ORDER",
                    "condition": "Retry deadline expired",
                    "action": "Unlock Stock"
                }
            }
        ]
    },
    {
        "id": "tpl-cicd-pipeline",
        "name": "CI/CD Automated Deployment Pipeline",
        "description": "Automated build, test, staging verification, security scan, and blue-green production deployment finite state automaton.",
        "category": "DevOps",
        "is_template": True,
        "nodes": [
            {
                "id": "s0",
                "type": "initialNode",
                "position": {"x": 80, "y": 200},
                "data": {
                    "id": "s0",
                    "label": "Code Pushed",
                    "type": "initial",
                    "description": "Git push webhook to main branch",
                    "action": "Trigger Webhook Listener"
                }
            },
            {
                "id": "s1",
                "type": "normalNode",
                "position": {"x": 360, "y": 200},
                "data": {
                    "id": "s1",
                    "label": "Build & Lint",
                    "type": "normal",
                    "description": "Compiling assets and executing static linter",
                    "action": "Run Docker Build"
                }
            },
            {
                "id": "s2",
                "type": "conditionalNode",
                "position": {"x": 640, "y": 200},
                "data": {
                    "id": "s2",
                    "label": "Test Suite",
                    "type": "conditional",
                    "description": "Running unit & integration test suites",
                    "action": "Execute Pytest & Jest"
                }
            },
            {
                "id": "s3",
                "type": "normalNode",
                "position": {"x": 920, "y": 120},
                "data": {
                    "id": "s3",
                    "label": "Staging Deploy",
                    "type": "normal",
                    "description": "Rolling out image to staging cluster",
                    "action": "K8s Helm Apply"
                }
            },
            {
                "id": "s4",
                "type": "finalNode",
                "position": {"x": 1220, "y": 120},
                "data": {
                    "id": "s4",
                    "label": "Production Deployed",
                    "type": "final",
                    "description": "Traffic shifted to green release in production",
                    "action": "Send Slack Broadcast"
                }
            },
            {
                "id": "s5",
                "type": "finalNode",
                "position": {"x": 920, "y": 320},
                "data": {
                    "id": "s5",
                    "label": "Build Terminated",
                    "type": "final",
                    "description": "Build pipeline aborted with notification to committer",
                    "action": "Create Bug Ticket"
                }
            }
        ],
        "edges": [
            {
                "id": "e_s0_s1",
                "source": "s0",
                "target": "s1",
                "animated": True,
                "data": {
                    "event": "START_BUILD",
                    "condition": "Valid branch ref",
                    "action": "Spin runner"
                }
            },
            {
                "id": "e_s1_s2",
                "source": "s1",
                "target": "s2",
                "animated": True,
                "data": {
                    "event": "BUILD_PASS",
                    "condition": "Exit code 0",
                    "action": "Upload Artifact"
                }
            },
            {
                "id": "e_s1_s5",
                "source": "s1",
                "target": "s5",
                "animated": True,
                "data": {
                    "event": "BUILD_FAIL",
                    "condition": "Syntax or lint error",
                    "action": "Alert Committer"
                }
            },
            {
                "id": "e_s2_s3",
                "source": "s2",
                "target": "s3",
                "animated": True,
                "data": {
                    "event": "TEST_PASS",
                    "condition": "Coverage >= 85%",
                    "action": "Tag Staging Release"
                }
            },
            {
                "id": "e_s2_s5",
                "source": "s2",
                "target": "s5",
                "animated": True,
                "data": {
                    "event": "TEST_FAIL",
                    "condition": "Test assertion failed",
                    "action": "Save Test Dump"
                }
            },
            {
                "id": "e_s3_s4",
                "source": "s3",
                "target": "s4",
                "animated": True,
                "data": {
                    "event": "PROMOTE_PROD",
                    "condition": "Health checks passing",
                    "action": "Switch Route 53 Traffic"
                }
            }
        ]
    },
    {
        "id": "tpl-academic-grading",
        "name": "Academic Evaluation & Moderation Automaton",
        "description": "Formal university course grade submission, peer review, department head approval, and registrar publishing FSM.",
        "category": "Academic",
        "is_template": True,
        "nodes": [
            {
                "id": "g0",
                "type": "initialNode",
                "position": {"x": 80, "y": 200},
                "data": {
                    "id": "g0",
                    "label": "Marks Drafted",
                    "type": "initial",
                    "description": "Instructor compiled examination marks",
                    "action": "Compute Bell Curve"
                }
            },
            {
                "id": "g1",
                "type": "normalNode",
                "position": {"x": 360, "y": 200},
                "data": {
                    "id": "g1",
                    "label": "Committee Review",
                    "type": "normal",
                    "description": "Department scrutiny committee verifies rubric compliance",
                    "action": "Check Statistical Outliers"
                }
            },
            {
                "id": "g2",
                "type": "conditionalNode",
                "position": {"x": 660, "y": 200},
                "data": {
                    "id": "g2",
                    "label": "Dean Approval",
                    "type": "conditional",
                    "description": "Faculty Dean sign-off on final letter grades",
                    "action": "Sign Cryptographic Hash"
                }
            },
            {
                "id": "g3",
                "type": "finalNode",
                "position": {"x": 980, "y": 140},
                "data": {
                    "id": "g3",
                    "label": "Grades Published",
                    "type": "final",
                    "description": "Official transcript portal updated and student notification triggered",
                    "action": "Lock Semester Record"
                }
            },
            {
                "id": "g4",
                "type": "normalNode",
                "position": {"x": 660, "y": 360},
                "data": {
                    "id": "g4",
                    "label": "Revision Required",
                    "type": "normal",
                    "description": "Marks returned to instructor for re-checking",
                    "action": "Send Review Comments"
                }
            }
        ],
        "edges": [
            {
                "id": "e_g0_g1",
                "source": "g0",
                "target": "g1",
                "animated": True,
                "data": {
                    "event": "SUBMIT_DRAFT",
                    "condition": "All student marks entered",
                    "action": "Lock Instructor Edit"
                }
            },
            {
                "id": "e_g1_g2",
                "source": "g1",
                "target": "g2",
                "animated": True,
                "data": {
                    "event": "SCRUTINY_PASS",
                    "condition": "Zero rubric deviations",
                    "action": "Forward to Dean"
                }
            },
            {
                "id": "e_g1_g4",
                "source": "g1",
                "target": "g4",
                "animated": True,
                "data": {
                    "event": "DISCREPANCY_FOUND",
                    "condition": "Discrepancy in tally > 1%",
                    "action": "Flag for Revision"
                }
            },
            {
                "id": "e_g4_g1",
                "source": "g4",
                "target": "g1",
                "animated": True,
                "data": {
                    "event": "RESUBMIT_CORRECTION",
                    "condition": "Corrections applied",
                    "action": "Re-queue for Review"
                }
            },
            {
                "id": "e_g2_g3",
                "source": "g2",
                "target": "g3",
                "animated": True,
                "data": {
                    "event": "DEAN_APPROVE",
                    "condition": "Signed digital key verified",
                    "action": "Publish to Portal"
                }
            }
        ]
    }
]

