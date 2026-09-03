package com.insurance.demo.scheduler;

import com.insurance.demo.entity.Policy;
import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PolicyScheduler {

    private final PolicyRepository policyRepository;

    /**
     * Daily background cron job running at midnight (00:00:00).
     * Scans all ACTIVE policies and flips status to LAPSED if overdue past grace period:
     * - 15 days grace period for MONTHLY policies
     * - 30 days grace period for all other recurring payment frequencies
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void autoLapseOverduePolicies() {
        log.info("Running scheduled job: Scanning for overdue active policies to lapse...");

        List<Policy> activePolicies = policyRepository.findByStatusAndNextPaymentDueDateNotNull(PolicyStatus.ACTIVE);
        int lapsedCount = 0;

        for (Policy policy : activePolicies) {
            int graceDays = (policy.getSelectedPremiumType() == PremiumType.MONTHLY) ? 15 : 30;
            if (LocalDate.now().isAfter(policy.getNextPaymentDueDate().plusDays(graceDays))) {
                policy.setStatus(PolicyStatus.LAPSED);
                policyRepository.save(policy);
                lapsedCount++;
                log.info("Policy ID {} (Number: {}) automatically updated to LAPSED. Next payment due date {} was exceeded by over {} days grace period.",
                        policy.getPolicyId(), policy.getPolicyNumber(), policy.getNextPaymentDueDate(), graceDays);
            }
        }

        log.info("Scheduled auto-lapse job completed. Total policies flipped to LAPSED: {}", lapsedCount);
    }
}
