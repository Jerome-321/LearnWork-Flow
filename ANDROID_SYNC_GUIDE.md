# Android Sync Guide - Unified AI Optimizer

## ✅ Git Push Complete!

Your changes have been pushed to GitHub:
- Repository: https://github.com/Jerome-321/LearnWork-Flow
- Commit: cc8ecac
- Branch: main

---

## 📱 Android Integration Guide

### Step 1: Update Android Project

If you have an Android app that connects to this backend, follow these steps:

#### Option A: Pull Latest Code (If Android is in same repo)

```bash
# Navigate to your Android project
cd /path/to/android/project

# Pull latest changes
git pull origin main

# Sync Gradle
./gradlew sync
```

#### Option B: Update API Endpoint (If separate Android project)

Update your Android app to use the new endpoint:

```kotlin
// In your API service interface (e.g., ApiService.kt)

interface ApiService {
    
    // Existing endpoint (still works)
    @POST("api/ai/analyze/")
    suspend fun analyzeTask(
        @Header("Authorization") token: String,
        @Body taskData: TaskAnalysisRequest
    ): Response<TaskAnalysisResponse>
    
    // NEW: Unified AI Optimizer endpoint
    @POST("api/ai/optimize-schedule/")
    suspend fun optimizeSchedule(
        @Header("Authorization") token: String
    ): Response<OptimizeScheduleResponse>
}
```

### Step 2: Create Data Models

```kotlin
// OptimizeScheduleResponse.kt
data class OptimizeScheduleResponse(
    val success: Boolean,
    val scheduled_tasks: List<ScheduledTask>,
    val performance: PerformanceMetrics,
    val message: String
)

data class ScheduledTask(
    val id: String,
    val title: String,
    val scheduled_time: String,
    val day: String,
    val priority: String,
    val duration: Int
)

data class PerformanceMetrics(
    val fitness_score: Double,
    val constraint_violations: Int,
    val optimization_quality: String,
    val algorithms_used: List<String>,
    val target_achieved: Boolean
)
```

### Step 3: Create Repository Function

```kotlin
// ScheduleRepository.kt
class ScheduleRepository(private val apiService: ApiService) {
    
    suspend fun optimizeSchedule(token: String): Result<OptimizeScheduleResponse> {
        return try {
            val response = apiService.optimizeSchedule("Bearer $token")
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to optimize schedule"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### Step 4: Create ViewModel

```kotlin
// ScheduleViewModel.kt
class ScheduleViewModel(
    private val repository: ScheduleRepository
) : ViewModel() {
    
    private val _optimizationState = MutableLiveData<OptimizationState>()
    val optimizationState: LiveData<OptimizationState> = _optimizationState
    
    fun optimizeSchedule(token: String) {
        viewModelScope.launch {
            _optimizationState.value = OptimizationState.Loading
            
            val result = repository.optimizeSchedule(token)
            
            _optimizationState.value = if (result.isSuccess) {
                OptimizationState.Success(result.getOrNull()!!)
            } else {
                OptimizationState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }
}

sealed class OptimizationState {
    object Loading : OptimizationState()
    data class Success(val data: OptimizeScheduleResponse) : OptimizationState()
    data class Error(val message: String) : OptimizationState()
}
```

### Step 5: Update UI (Activity/Fragment)

```kotlin
// ScheduleActivity.kt
class ScheduleActivity : AppCompatActivity() {
    
    private lateinit var viewModel: ScheduleViewModel
    private lateinit var binding: ActivityScheduleBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScheduleBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        viewModel = ViewModelProvider(this)[ScheduleViewModel::class.java]
        
        setupObservers()
        setupClickListeners()
    }
    
    private fun setupClickListeners() {
        binding.btnOptimizeSchedule.setOnClickListener {
            val token = getAuthToken() // Get from SharedPreferences
            viewModel.optimizeSchedule(token)
        }
    }
    
    private fun setupObservers() {
        viewModel.optimizationState.observe(this) { state ->
            when (state) {
                is OptimizationState.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.btnOptimizeSchedule.isEnabled = false
                }
                
                is OptimizationState.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnOptimizeSchedule.isEnabled = true
                    
                    displayOptimizedSchedule(state.data)
                    showPerformanceMetrics(state.data.performance)
                }
                
                is OptimizationState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnOptimizeSchedule.isEnabled = true
                    
                    Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private fun displayOptimizedSchedule(data: OptimizeScheduleResponse) {
        // Group tasks by day
        val tasksByDay = data.scheduled_tasks.groupBy { it.day }
        
        // Update RecyclerView or UI
        binding.tvMessage.text = data.message
        
        // Show success message
        if (data.performance.target_achieved) {
            Snackbar.make(
                binding.root,
                "✅ 100% Performance Achieved!",
                Snackbar.LENGTH_LONG
            ).show()
        }
    }
    
    private fun showPerformanceMetrics(metrics: PerformanceMetrics) {
        binding.tvFitnessScore.text = "Fitness: ${metrics.fitness_score}/100"
        binding.tvViolations.text = "Violations: ${metrics.constraint_violations}"
        binding.tvQuality.text = "Quality: ${metrics.optimization_quality}"
        
        // Show badge if perfect
        if (metrics.target_achieved) {
            binding.imgPerfectBadge.visibility = View.VISIBLE
        }
    }
}
```

### Step 6: Add UI Layout

```xml
<!-- activity_schedule.xml -->
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">
    
    <Button
        android:id="@+id/btnOptimizeSchedule"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Optimize My Schedule"
        android:textSize="16sp"
        android:padding="16dp"/>
    
    <ProgressBar
        android:id="@+id/progressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:visibility="gone"/>
    
    <TextView
        android:id="@+id/tvMessage"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:textSize="14sp"/>
    
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:layout_marginTop="16dp">
        
        <TextView
            android:id="@+id/tvFitnessScore"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Fitness: -/100"/>
        
        <TextView
            android:id="@+id/tvViolations"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Violations: -"/>
        
        <TextView
            android:id="@+id/tvQuality"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Quality: -"/>
    </LinearLayout>
    
    <ImageView
        android:id="@+id/imgPerfectBadge"
        android:layout_width="100dp"
        android:layout_height="100dp"
        android:layout_gravity="center"
        android:layout_marginTop="16dp"
        android:src="@drawable/ic_perfect_badge"
        android:visibility="gone"/>
    
    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/rvScheduledTasks"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:layout_marginTop="16dp"/>
</LinearLayout>
```

### Step 7: Add Dependencies (build.gradle)

```gradle
dependencies {
    // Retrofit for API calls
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    
    // ViewModel and LiveData
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.2'
    
    // RecyclerView
    implementation 'androidx.recyclerview:recyclerview:1.3.2'
}
```

---

## 🔄 Testing the Integration

### Test 1: Check Backend is Running

```bash
# Test the endpoint
curl -X POST http://your-backend-url/api/ai/optimize-schedule/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Test from Android

```kotlin
// In your test or debug code
viewModel.optimizeSchedule(testToken)
```

Expected response:
```json
{
  "success": true,
  "scheduled_tasks": [...],
  "performance": {
    "fitness_score": 100.0,
    "constraint_violations": 0,
    "optimization_quality": "Perfect",
    "target_achieved": true
  }
}
```

---

## 📊 Display Performance Metrics

Show users the AI performance:

```kotlin
fun showPerformanceDialog(metrics: PerformanceMetrics) {
    AlertDialog.Builder(this)
        .setTitle("🎯 Optimization Complete!")
        .setMessage("""
            Fitness Score: ${metrics.fitness_score}/100
            Violations: ${metrics.constraint_violations}
            Quality: ${metrics.optimization_quality}
            
            Algorithms Used:
            ${metrics.algorithms_used.joinToString("\n") { "• $it" }}
            
            ${if (metrics.target_achieved) "✅ 100% Performance Achieved!" else ""}
        """.trimIndent())
        .setPositiveButton("OK", null)
        .show()
}
```

---

## 🚀 Deployment Checklist

- [ ] Backend deployed with new endpoint
- [ ] Android app updated with new API models
- [ ] Retrofit service interface updated
- [ ] UI updated with optimization button
- [ ] Performance metrics displayed
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Tested on real device
- [ ] Published to Play Store (if applicable)

---

## 📱 Alternative: React Native / Flutter

### React Native

```javascript
const optimizeSchedule = async (token) => {
  try {
    const response = await fetch('https://your-api.com/api/ai/optimize-schedule/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Fitness:', data.performance.fitness_score);
      console.log('Tasks:', data.scheduled_tasks);
    }
  } catch (error) {
    console.error('Optimization failed:', error);
  }
};
```

### Flutter

```dart
Future<OptimizeScheduleResponse> optimizeSchedule(String token) async {
  final response = await http.post(
    Uri.parse('https://your-api.com/api/ai/optimize-schedule/'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    return OptimizeScheduleResponse.fromJson(jsonDecode(response.body));
  } else {
    throw Exception('Failed to optimize schedule');
  }
}
```

---

## ✅ Summary

**Git Status**: ✅ Pushed to GitHub
**Commit**: cc8ecac
**Files Changed**: 10 files, 1792 insertions

**Android Integration**:
1. Add new API endpoint to service
2. Create data models
3. Update ViewModel
4. Add UI button
5. Display results
6. Test and deploy

**Backend URL**: Update in your Android app's config
**Endpoint**: `/api/ai/optimize-schedule/`
**Method**: POST
**Auth**: Required (Bearer token)

---

**Status**: ✅ READY FOR ANDROID INTEGRATION
