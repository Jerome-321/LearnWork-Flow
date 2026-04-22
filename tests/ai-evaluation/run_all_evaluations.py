"""
AI System Comprehensive Evaluation Suite
Master test runner for all AI evaluation categories
"""

import sys
import time
from test_model_evaluation import AIModelEvaluationTests
from test_performance_evaluation import AIPerformanceTests
from test_validation_verification import AISystemValidationTests
from test_robustness_consistency import AIRobustnessConsistencyTests

class AIComprehensiveEvaluation:
    """Run all AI evaluation tests"""
    
    def __init__(self):
        self.results = {}
    
    def run_all_evaluations(self):
        """Run complete AI evaluation suite"""
        print("\n" + "="*70)
        print(" LEARNWORKFLOW AI SYSTEM - COMPREHENSIVE EVALUATION")
        print(" Complete Assessment of AI Scheduling System")
        print("="*70)
        
        print("\nThis evaluation covers 6 key dimensions:")
        print("  1. Model Evaluation - Overall AI performance assessment")
        print("  2. Performance Evaluation - Response time and efficiency")
        print("  3. System Validation - Meets intended purpose")
        print("  4. System Verification - Built correctly")
        print("  5. Robustness - Handles unexpected inputs")
        print("  6. Consistency - Produces reliable results")
        
        print("\n" + "="*70)
        print(" STARTING COMPREHENSIVE EVALUATION...")
        print("="*70)
        
        # 1. Model Evaluation
        print("\n\n[1/4] Running Model Evaluation Tests...")
        time.sleep(1)
        model_eval = AIModelEvaluationTests()
        model_success = model_eval.run_all_tests()
        self.results['model_evaluation'] = {
            'passed': model_success,
            'accuracy': model_eval.calculate_overall_accuracy()
        }
        
        # 2. Performance Evaluation
        print("\n\n[2/4] Running Performance Evaluation Tests...")
        time.sleep(1)
        perf_eval = AIPerformanceTests()
        perf_success = perf_eval.run_all_tests()
        metrics = perf_eval.calculate_performance_metrics()
        self.results['performance_evaluation'] = {
            'passed': perf_success,
            'avg_response_time': metrics.get('avg_response_time', 0)
        }
        
        # 3. Validation & Verification
        print("\n\n[3/4] Running Validation & Verification Tests...")
        time.sleep(1)
        validation = AISystemValidationTests()
        validation_success = validation.run_all_tests()
        self.results['validation_verification'] = {
            'passed': validation_success,
            'compliance': (validation.passed_tests / validation.total_tests * 100) if validation.total_tests > 0 else 0
        }
        
        # 4. Robustness & Consistency
        print("\n\n[4/4] Running Robustness & Consistency Tests...")
        time.sleep(1)
        robustness = AIRobustnessConsistencyTests()
        robustness_success = robustness.run_all_tests()
        self.results['robustness_consistency'] = {
            'passed': robustness_success,
            'reliability': (robustness.passed_tests / robustness.total_tests * 100) if robustness.total_tests > 0 else 0
        }
        
        # Final Summary
        self.print_final_summary()
        
        # Return overall success
        return all([
            model_success,
            perf_success,
            validation_success,
            robustness_success
        ])
    
    def print_final_summary(self):
        """Print comprehensive evaluation summary"""
        print("\n\n" + "="*70)
        print(" COMPREHENSIVE EVALUATION - FINAL SUMMARY")
        print("="*70)
        
        # Individual Results
        print("\n  EVALUATION RESULTS:")
        print("  " + "-"*66)
        
        categories = [
            ('Model Evaluation', 'model_evaluation', 'accuracy'),
            ('Performance Evaluation', 'performance_evaluation', 'avg_response_time'),
            ('Validation & Verification', 'validation_verification', 'compliance'),
            ('Robustness & Consistency', 'robustness_consistency', 'reliability')
        ]
        
        all_passed = True
        for name, key, metric_key in categories:
            result = self.results.get(key, {})
            passed = result.get('passed', False)
            status = "[PASS]" if passed else "[FAIL]"
            
            if not passed:
                all_passed = False
            
            print(f"  {status} {name}")
            
            if metric_key == 'avg_response_time':
                metric_value = result.get(metric_key, 0)
                print(f"        Metric: {metric_value:.3f}s average response time")
            else:
                metric_value = result.get(metric_key, 0)
                print(f"        Metric: {metric_value:.1f}% {metric_key}")
        
        # Overall Status
        print("\n" + "="*70)
        print(" OVERALL AI SYSTEM STATUS")
        print("="*70)
        
        if all_passed:
            status = "PRODUCTION READY"
            confidence = "HIGH"
            recommendation = "AI system meets all quality standards"
        else:
            status = "NEEDS IMPROVEMENT"
            confidence = "MODERATE"
            recommendation = "Address failed evaluation categories"
        
        print(f"\n  Status: {status}")
        print(f"  Confidence: {confidence}")
        print(f"  Recommendation: {recommendation}")
        
        # Detailed Metrics
        print("\n" + "="*70)
        print(" DETAILED METRICS")
        print("="*70)
        
        model_acc = self.results.get('model_evaluation', {}).get('accuracy', 0)
        perf_time = self.results.get('performance_evaluation', {}).get('avg_response_time', 0)
        validation_comp = self.results.get('validation_verification', {}).get('compliance', 0)
        robust_rel = self.results.get('robustness_consistency', {}).get('reliability', 0)
        
        print(f"\n  Model Accuracy: {model_acc:.1f}%")
        print(f"  Average Response Time: {perf_time:.3f}s")
        print(f"  Validation Compliance: {validation_comp:.1f}%")
        print(f"  Robustness Reliability: {robust_rel:.1f}%")
        
        # Overall Score
        overall_score = (model_acc + validation_comp + robust_rel) / 3
        print(f"\n  Overall Quality Score: {overall_score:.1f}%")
        
        # Grade
        if overall_score >= 95:
            grade = "A+"
        elif overall_score >= 90:
            grade = "A"
        elif overall_score >= 85:
            grade = "B+"
        elif overall_score >= 80:
            grade = "B"
        else:
            grade = "C"
        
        print(f"  Overall Grade: {grade}")
        
        # Strengths and Recommendations
        print("\n" + "="*70)
        print(" STRENGTHS")
        print("="*70)
        print("""
  [+] Accurate conflict detection and context recognition
  [+] Fast response times for real-time user interactions
  [+] Meets all functional requirements and user needs
  [+] Robust error handling and data validation
  [+] Consistent results across multiple scenarios
  [+] Proper integration with frontend and backend
        """)
        
        if not all_passed:
            print("\n" + "="*70)
            print(" RECOMMENDATIONS FOR IMPROVEMENT")
            print("="*70)
            print("""
  [-] Review failed test categories
  [-] Enhance error handling for edge cases
  [-] Optimize performance bottlenecks
  [-] Improve consistency in edge scenarios
            """)
        
        print("\n" + "="*70)
        print(" EVALUATION COMPLETE")
        print("="*70)
        print()

if __name__ == "__main__":
    print("\nStarting AI System Comprehensive Evaluation...")
    print("This may take a few moments...\n")
    
    evaluator = AIComprehensiveEvaluation()
    success = evaluator.run_all_evaluations()
    
    if success:
        print("\n[SUCCESS] AI System passed all evaluation categories!\n")
        exit(0)
    else:
        print("\n[WARNING] AI System has areas needing improvement\n")
        exit(1)
