use serde::{Deserialize, Serialize};
use worker::*;

#[derive(Deserialize)]
pub struct AITaskGenerationRequest {
    pub title: String,
    #[serde(rename = "type")]
    pub task_type: Option<String>,
    pub context: Option<String>,
    pub epic: Option<String>,
}

#[derive(Serialize)]
pub struct AITaskGenerationResponse {
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

#[derive(Deserialize)]
pub struct AIAcceptanceCriteriaRequest {
    pub title: String,
    pub description: String,
    #[serde(rename = "type")]
    pub task_type: String,
    #[serde(rename = "existingCriteria")]
    pub existing_criteria: Option<Vec<String>>,
}

#[derive(Deserialize)]
pub struct AIStoryPointEstimationRequest {
    pub title: String,
    pub description: String,
    #[serde(rename = "acceptanceCriteria")]
    pub acceptance_criteria: Vec<String>,
    #[serde(rename = "technicalTasks")]
    pub technical_tasks: Vec<String>,
    #[serde(rename = "type")]
    pub task_type: String,
}

#[derive(Deserialize)]
pub struct AIDependencyAnalysisRequest {
    pub task: TaskForAnalysis,
    #[serde(rename = "existingTasks")]
    pub existing_tasks: Vec<TaskForAnalysis>,
}

#[derive(Deserialize)]
pub struct TaskForAnalysis {
    pub id: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "type")]
    pub task_type: String,
    pub status: Option<String>,
}

#[derive(Serialize)]
pub struct AIDependencyAnalysisResponse {
    pub dependencies: Vec<String>,
    pub blocks: Vec<String>,
    pub reasoning: String,
}

#[derive(Deserialize)]
pub struct AISprintPlanningRequest {
    pub tasks: Vec<SprintTaskInfo>,
    #[serde(rename = "sprintCapacity")]
    pub sprint_capacity: u32,
    #[serde(rename = "sprintGoal")]
    pub sprint_goal: Option<String>,
}

#[derive(Deserialize)]
pub struct SprintTaskInfo {
    pub id: String,
    pub title: String,
    #[serde(rename = "storyPoints")]
    pub story_points: Option<u32>,
    pub priority: String,
    pub dependencies: Vec<String>,
}

#[derive(Serialize)]
pub struct AISprintPlanningResponse {
    #[serde(rename = "recommendedTasks")]
    pub recommended_tasks: Vec<String>,
    pub reasoning: String,
    #[serde(rename = "totalStoryPoints")]
    pub total_story_points: u32,
    pub warnings: Option<Vec<String>>,
}

#[derive(Deserialize)]
pub struct AIConfig {
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

// AI provider implementations
pub struct OpenAIProvider {
    api_key: String,
    endpoint: String,
    model: String,
}

impl OpenAIProvider {
    pub fn new(api_key: String, model: Option<String>) -> Self {
        Self {
            api_key,
            endpoint: "https://api.openai.com/v1/chat/completions".to_string(),
            model: model.unwrap_or_else(|| "gpt-4".to_string()),
        }
    }

    pub async fn generate_task_details(
        &self,
        request: &AITaskGenerationRequest,
    ) -> Result<AITaskGenerationResponse> {
        let prompt = format!(
            "You are an expert project manager helping to generate detailed task information. \
             Given the task title '{}' and type '{}', please generate: \
             1. A detailed description \
             2. Acceptance criteria (3-5 items) \
             3. Technical tasks (3-5 items) \
             4. Story point estimate (1-13 scale) \
             5. Priority suggestion (Critical, High, Medium, Low) \
             \
             Context: {} \
             Epic: {} \
             \
             Respond in JSON format with the following structure: \
             {{
               \"description\": \"...\",
               \"acceptanceCriteria\": [...],
               \"technicalTasks\": [...],
               \"estimatedStoryPoints\": 5,
               \"suggestedPriority\": \"Medium\"
             }}",
            request.title,
            request.task_type.as_deref().unwrap_or("Story"),
            request
                .context
                .as_deref()
                .unwrap_or("No additional context"),
            request.epic.as_deref().unwrap_or("No epic specified")
        );

        let response = self.call_openai(&prompt).await?;
        self.parse_task_generation_response(&response)
    }

    pub async fn generate_acceptance_criteria(
        &self,
        request: &AIAcceptanceCriteriaRequest,
    ) -> Result<Vec<String>> {
        let existing_criteria_text = request
            .existing_criteria
            .as_ref()
            .map(|criteria| format!("Existing criteria: {}", criteria.join(", ")))
            .unwrap_or_else(|| "No existing criteria".to_string());

        let prompt = format!(
            "Generate 3-5 acceptance criteria for a {} task titled '{}'. \
             Description: {} \
             {} \
             \
             Return only a JSON array of strings, like: [\"criterion 1\", \"criterion 2\", ...]",
            request.task_type, request.title, request.description, existing_criteria_text
        );

        let response = self.call_openai(&prompt).await?;
        self.parse_array_response(&response)
    }

    pub async fn estimate_story_points(
        &self,
        request: &AIStoryPointEstimationRequest,
    ) -> Result<u32> {
        let prompt = format!(
            "Estimate story points (1-13 scale) for this {} task: \
             Title: {} \
             Description: {} \
             Acceptance Criteria: {} \
             Technical Tasks: {} \
             \
             Consider complexity, effort, and uncertainty. Respond with only a number between 1 and 13.",
            request.task_type,
            request.title,
            request.description,
            request.acceptance_criteria.join(", "),
            request.technical_tasks.join(", ")
        );

        let response = self.call_openai(&prompt).await?;
        self.parse_number_response(&response)
    }

    async fn call_openai(&self, prompt: &str) -> Result<String> {
        let headers = Headers::new();
        headers.set("Authorization", &format!("Bearer {}", self.api_key))?;
        headers.set("Content-Type", "application/json")?;

        let body = serde_json::json!({
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        });

        let mut init = RequestInit::new();
        init.with_method(Method::Post);
        init.with_headers(headers);
        init.with_body(Some(body.to_string().into()));

        let request = Request::new_with_init(&self.endpoint, &init)?;
        let mut response = Fetch::Request(request).send().await?;

        if response.status_code() != 200 {
            return Err(Error::from(format!(
                "OpenAI API error: {}",
                response.status_code()
            )));
        }

        let response_text = response.text().await?;
        let parsed: serde_json::Value = serde_json::from_str(&response_text)
            .map_err(|e| Error::from(format!("Failed to parse OpenAI response: {}", e)))?;

        let content = parsed["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| Error::from("No content in OpenAI response"))?;

        Ok(content.to_string())
    }

    fn parse_task_generation_response(&self, response: &str) -> Result<AITaskGenerationResponse> {
        let parsed: serde_json::Value = serde_json::from_str(response)
            .map_err(|e| Error::from(format!("Failed to parse AI response: {}", e)))?;

        Ok(AITaskGenerationResponse {
            suggested_title: None,
            description: parsed["description"].as_str().unwrap_or("").to_string(),
            acceptance_criteria: parsed["acceptanceCriteria"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect()
                })
                .unwrap_or_default(),
            technical_tasks: parsed["technicalTasks"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect()
                })
                .unwrap_or_default(),
            estimated_story_points: parsed["estimatedStoryPoints"].as_u64().map(|n| n as u32),
            suggested_type: None,
            suggested_priority: parsed["suggestedPriority"].as_str().map(|s| s.to_string()),
            dependencies: None,
        })
    }

    fn parse_array_response(&self, response: &str) -> Result<Vec<String>> {
        let parsed: Vec<String> = serde_json::from_str(response)
            .map_err(|e| Error::from(format!("Failed to parse array response: {}", e)))?;
        Ok(parsed)
    }

    fn parse_number_response(&self, response: &str) -> Result<u32> {
        let cleaned = response.trim();
        cleaned
            .parse::<u32>()
            .map_err(|e| Error::from(format!("Failed to parse number response: {}", e)))
    }
}

pub async fn get_ai_provider(env: &Env) -> Result<Option<OpenAIProvider>> {
    // Get AI configuration from environment or database
    // For now, we'll check for environment variables
    if let (Ok(api_key), Ok(enabled)) = (env.secret("AI_API_KEY"), env.var("AI_ENABLED")) {
        if enabled.to_string() == "true" {
            let model = env.var("AI_MODEL").map(|v| v.to_string()).ok();

            return Ok(Some(OpenAIProvider::new(api_key.to_string(), model)));
        }
    }

    Ok(None)
}
