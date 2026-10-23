package com.learning.backend;

import com.learning.backend.controller.AdminController;
import com.learning.backend.service.AdminService;
import com.learning.backend.service.MlClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AdminMlControllerTest {

    @Mock
    private AdminService adminService;

    @Mock
    private MlClient mlClient;

    private AdminController controller;

    @BeforeEach
    void setUp() {
        controller = new AdminController(adminService, mlClient);
    }

    @Test
    void testGetMlMetricsSuccess() {
        Map<String, Object> mockReport = Map.of(
                "phase", "PHASE 1: EVALUATION",
                "dataset", Map.of("is_synthetic", true),
                "level_classifier", Map.of(
                        "random_forest", Map.of("accuracy", 0.9067, "macro_f1", 0.9041),
                        "majority_class_baseline", Map.of("accuracy", 0.4033)
                )
        );
        when(mlClient.getLatestMetrics()).thenReturn(Optional.of(mockReport));

        Map<String, Object> res = controller.getMlMetrics();
        assertNotNull(res);
        assertEquals("PHASE 1: EVALUATION", res.get("phase"));
    }

    @Test
    void testGetMlMetricsFallbackWhenUnavailable() {
        when(mlClient.getLatestMetrics()).thenReturn(Optional.empty());

        Map<String, Object> res = controller.getMlMetrics();
        assertNotNull(res);
        assertEquals("unavailable", res.get("status"));
    }

    @Test
    void testRetrainSuccess() {
        Map<String, Object> mockRes = Map.of(
                "status", "retrained",
                "replaced", true,
                "current_score", 0.9041,
                "candidate_score", 0.9080
        );
        when(mlClient.retrain(any())).thenReturn(Optional.of(mockRes));

        Map<String, Object> res = controller.retrainMl(Map.of());
        assertNotNull(res);
        assertEquals("retrained", res.get("status"));
        assertEquals(true, res.get("replaced"));
    }

    @Test
    void testRetrainRejectionGuardrail() {
        Map<String, Object> mockRes = Map.of(
                "status", "rejected",
                "replaced", false,
                "reason", "Candidate model score (85.00%) is worse than current live model (90.41%) by more than 2 percentage points."
        );
        when(mlClient.retrain(any())).thenReturn(Optional.of(mockRes));

        Map<String, Object> res = controller.retrainMl(Map.of("simulate_degradation", true));
        assertNotNull(res);
        assertEquals("rejected", res.get("status"));
        assertEquals(false, res.get("replaced"));
        assertTrue(((String) res.get("reason")).contains("by more than 2 percentage points"));
    }
}
