//use serde_json;

// Simplified AI request/response structs for testing

#[derive(serde::Deserialize)]
pub struct SimpleAITaskGenerationRequest {
    pub title: String,
    #[serde(rename = "type")]
    pub task_type: Option<String>,
    pub context: Option<String>,
    pub epic: Option<String>,
}

#[derive(serde::Serialize)]
pub struct SimpleAITaskGenerationResponse {
    #[serde(rename = "suggestedTitle")]
    pub suggested_title: Option<String>,
    pub description: String,
    #[serde(rename = "acceptanceCriteria")]
    pub acceptance_criteria: Vec<String>,
    #[serde(rename = "technicalTasks")]
    pub technical_tasks: Vec<String>,
    #[serde(rename = "estimatedStoryPoints")]
    pub estimated_story_points: Option<u32>,
    #[serde(rename = "suggestedType")]
    pub suggested_type: Option<String>,
    #[serde(rename = "suggestedPriority")]
    pub suggested_priority: Option<String>,
    pub dependencies: Option<Vec<String>>,
}

#[derive(serde::Deserialize)]
pub struct SimpleAIAcceptanceCriteriaRequest {
    pub title: String,
    pub description: String,
    #[serde(rename = "type")]
    pub task_type: String,
    #[serde(rename = "existingCriteria")]
    pub existing_criteria: Option<Vec<String>>,
}

#[derive(serde::Deserialize)]
pub struct SimpleAIStoryPointEstimationRequest {
    pub title: String,
    pub description: String,
    #[serde(rename = "acceptanceCriteria")]
    pub acceptance_criteria: Vec<String>,
    #[serde(rename = "technicalTasks")]
    pub technical_tasks: Vec<String>,
    #[serde(rename = "type")]
    pub task_type: String,
}

#[derive(serde::Deserialize)]
pub struct SimpleAIDependencyAnalysisRequest {
    pub task: SimpleTaskForAnalysis,
    #[serde(rename = "existingTasks")]
    pub existing_tasks: Vec<SimpleTaskForAnalysis>,
}

#[derive(serde::Deserialize)]
pub struct SimpleTaskForAnalysis {
    pub id: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "type")]
    pub task_type: String,
    pub status: Option<String>,
}

#[derive(serde::Serialize)]
pub struct SimpleAIDependencyAnalysisResponse {
    pub dependencies: Vec<String>,
    pub blocks: Vec<String>,
    pub reasoning: String,
}

#[derive(serde::Deserialize)]
pub struct SimpleAISprintPlanningRequest {
    pub tasks: Vec<SimpleSprintTaskInfo>,
    #[serde(rename = "sprintCapacity")]
    pub sprint_capacity: u32,
    #[serde(rename = "sprintGoal")]
    pub sprint_goal: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct SimpleSprintTaskInfo {
    pub id: String,
    pub title: String,
    #[serde(rename = "storyPoints")]
    pub story_points: Option<u32>,
    pub priority: String,
    pub dependencies: Vec<String>,
}

#[derive(serde::Serialize)]
pub struct SimpleAISprintPlanningResponse {
    #[serde(rename = "recommendedTasks")]
    pub recommended_tasks: Vec<String>,
    pub reasoning: String,
    #[serde(rename = "totalStoryPoints")]
    pub total_story_points: u32,
    pub warnings: Option<Vec<String>>,
}

#[derive(serde::Deserialize)]
pub struct SimpleAIConfig {
    pub enabled: bool,
    pub provider: String,
    #[serde(rename = "apiKey")]
    pub api_key: String,
    pub endpoint: Option<String>,
    pub model: Option<String>,
    #[serde(rename = "maxTokens")]
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
}

#[test]
fn test_simple_ai_task_generation_request_deserialization() {
    let json = r#"
    {
        "title": "Test Task",
        "type": "Story",
        "context": "Some context",
        "epic": "Test Epic"
    }
    "#;

    let request: SimpleAITaskGenerationRequest = serde_json::from_str(json).unwrap();

    assert_eq!(request.title, "Test Task");
    assert_eq!(request.task_type, Some("Story".to_string()));
    assert_eq!(request.context, Some("Some context".to_string()));
    assert_eq!(request.epic, Some("Test Epic".to_string()));
}

#[test]
fn test_simple_ai_task_generation_request_minimal() {
    let json = r#"
    {
        "title": "Minimal Task"
    }
    "#;

    let request: SimpleAITaskGenerationRequest = serde_json::from_str(json).unwrap();

    assert_eq!(request.title, "Minimal Task");
    assert!(request.task_type.is_none());
    assert!(request.context.is_none());
    assert!(request.epic.is_none());
}

#[test]
fn test_simple_ai_task_generation_response_serialization() {
    let response = SimpleAITaskGenerationResponse {
        suggested_title: Some("Improved Title".to_string()),
        description: "A detailed description".to_string(),
        acceptance_criteria: vec!["Criterion 1".to_string(), "Criterion 2".to_string()],
        technical_tasks: vec!["Task 1".to_string(), "Task 2".to_string()],
        estimated_story_points: Some(5),
        suggested_type: Some("Story".to_string()),
        suggested_priority: Some("High".to_string()),
        dependencies: Some(vec!["TASK-123".to_string()]),
    };

    let json = serde_json::to_string(&response).unwrap();

    assert!(json.contains("\"suggestedTitle\""));
    assert!(json.contains("\"Improved Title\""));
    assert!(json.contains("\"acceptanceCriteria\""));
    assert!(json.contains("\"technicalTasks\""));
    assert!(json.contains("\"estimatedStoryPoints\":5"));
}

#[test]
fn test_simple_ai_acceptance_criteria_request_deserialization() {
    let json = r#"
    {
        "title": "Test Task",
        "description": "Task description",
        "type": "Story",
        "existingCriteria": ["Existing criterion"]
    }
    "#;

    let request: SimpleAIAcceptanceCriteriaRequest = serde_json::from_str(json).unwrap();

    assert_eq!(request.title, "Test Task");
    assert_eq!(request.description, "Task description");
    assert_eq!(request.task_type, "Story");
    assert_eq!(
        request.existing_criteria,
        Some(vec!["Existing criterion".to_string()])
    );
}

#[test]
fn test_simple_ai_story_point_estimation_request_deserialization() {
    let json = r#"
    {
        "title": "Test Task",
        "description": "Task description",
        "acceptanceCriteria": ["AC1", "AC2"],
        "technicalTasks": ["TT1", "TT2"],
        "type": "Story"
    }
    "#;

    let request: SimpleAIStoryPointEstimationRequest = serde_json::from_str(json).unwrap();

    assert_eq!(request.title, "Test Task");
    assert_eq!(request.description, "Task description");
    assert_eq!(request.acceptance_criteria, vec!["AC1", "AC2"]);
    assert_eq!(request.technical_tasks, vec!["TT1", "TT2"]);
    assert_eq!(request.task_type, "Story");
}

#[test]
fn test_simple_ai_dependency_analysis_request_deserialization() {
    let json = r#"
    {
        "task": {
            "id": "TASK-123",
            "title": "Test Task",
            "description": "Task description",
            "type": "Story",
            "status": "Todo"
        },
        "existingTasks": [
            {
                "id": "TASK-456",
                "title": "Existing Task",
                "description": "Existing description",
                "type": "Bug",
                "status": "Done"
            }
        ]
    }
    "#;

    let request: SimpleAIDependencyAnalysisRequest = serde_json::from_str(json).unwrap();

    assert_eq!(request.task.id, "TASK-123");
    assert_eq!(request.task.title, "Test Task");
    assert_eq!(request.existing_tasks.len(), 1);
    assert_eq!(request.existing_tasks[0].id, "TASK-456");
}

#[test]
fn test_simple_ai_dependency_analysis_response_serialization() {
    let response = SimpleAIDependencyAnalysisResponse {
        dependencies: vec!["TASK-456".to_string()],
        blocks: vec!["TASK-789".to_string()],
        reasoning: "Analysis reasoning".to_string(),
    };

    let json = serde_json::to_string(&response).unwrap();

    assert!(json.contains("\"dependencies\""));
    assert!(json.contains("\"TASK-456\""));
    assert!(json.contains("\"blocks\""));
    assert!(json.contains("\"reasoning\""));
}

#[test]
fn test_simple_ai_sprint_planning_request_deserialization() {
    let json = r#"
    {
        "tasks": [
            {
                "id": "TASK-123",
                "title": "Test Task",
                "storyPoints": 5,
                "priority": "High",
                "dependencies": ["TASK-456"]
            }
        ],
        "sprintCapacity": 40,
        "sprintGoal": "Complete user authentication"
    }
    "#;

    let request: SimpleAISprintPlanningRequest = serde_json::from_str(json).unwrap();

    assert_eq!(request.tasks.len(), 1);
    assert_eq!(request.tasks[0].id, "TASK-123");
    assert_eq!(request.tasks[0].story_points, Some(5));
    assert_eq!(request.sprint_capacity, 40);
    assert_eq!(
        request.sprint_goal,
        Some("Complete user authentication".to_string())
    );
}

#[test]
fn test_simple_ai_sprint_planning_response_serialization() {
    let response = SimpleAISprintPlanningResponse {
        recommended_tasks: vec!["TASK-123".to_string(), "TASK-456".to_string()],
        reasoning: "Recommended based on priority and capacity".to_string(),
        total_story_points: 25,
        warnings: Some(vec!["Capacity might be exceeded".to_string()]),
    };

    let json = serde_json::to_string(&response).unwrap();

    assert!(json.contains("\"recommendedTasks\""));
    assert!(json.contains("\"totalStoryPoints\":25"));
    assert!(json.contains("\"warnings\""));
}

#[test]
fn test_simple_ai_config_deserialization() {
    let json = r#"
    {
        "enabled": true,
        "provider": "openai",
        "apiKey": "sk-test-key",
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-4",
        "maxTokens": 1000,
        "temperature": 0.7
    }
    "#;

    let config: SimpleAIConfig = serde_json::from_str(json).unwrap();

    assert!(config.enabled);
    assert_eq!(config.provider, "openai");
    assert_eq!(config.api_key, "sk-test-key");
    assert_eq!(
        config.endpoint,
        Some("https://api.openai.com/v1/chat/completions".to_string())
    );
    assert_eq!(config.model, Some("gpt-4".to_string()));
    assert_eq!(config.max_tokens, Some(1000));
    assert_eq!(config.temperature, Some(0.7));
}
