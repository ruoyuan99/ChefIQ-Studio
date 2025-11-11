/**
 * 优化的YouTube视频推荐实现方案
 * 
 * 这个方案结合了方案A和方案B的优点：
 * 1. 使用YouTube API确保视频存在性和实时性
 * 2. 使用OpenAI生成高质量的搜索查询
 * 3. 使用OpenAI分析视频内容，生成更准确的说明
 */

/**
 * 方案C：混合优化方案
 * 
 * 流程：
 * 1. OpenAI生成优化的搜索查询和初步说明
 * 2. YouTube API搜索获取视频详情
 * 3. OpenAI分析视频标题和描述，生成更准确的说明
 * 4. 返回视频详情和AI优化的说明
 */

async function getOptimizedYouTubeVideos(recipeData) {
  try {
    // Step 1: OpenAI生成搜索查询和初步说明
    const aiRecommendations = await getYouTubeVideoRecommendationsFromAI(recipeData);
    
    if (!aiRecommendations || aiRecommendations.length === 0) {
      return { searchUrl: generateFallbackSearchUrl(recipeData), videos: [] };
    }
    
    // Step 2: YouTube API搜索获取视频详情
    const videoPromises = aiRecommendations.map(async (aiRec) => {
      const videoDetail = await searchYouTubeVideoByQuery(aiRec.searchQuery);
      if (videoDetail) {
        return {
          videoDetail,
          aiDescription: aiRec.description,
          searchQuery: aiRec.searchQuery,
        };
      }
      return null;
    });
    
    const videoResults = (await Promise.all(videoPromises)).filter(Boolean);
    
    if (videoResults.length === 0) {
      return { searchUrl: generateFallbackSearchUrl(recipeData), videos: [] };
    }
    
    // Step 3: OpenAI分析视频内容，生成更准确的说明
    const optimizedVideos = await Promise.all(
      videoResults.map(async ({ videoDetail, aiDescription, searchQuery }) => {
        // 使用OpenAI分析视频标题和描述，生成更准确的说明
        const optimizedDescription = await generateOptimizedVideoDescription(
          recipeData,
          videoDetail,
          aiDescription
        );
        
        return {
          ...videoDetail,
          description: optimizedDescription || aiDescription || videoDetail.description,
          aiDescription: optimizedDescription || aiDescription,
        };
      })
    );
    
    // Step 4: 去重并返回
    const uniqueVideos = removeDuplicateVideos(optimizedVideos);
    
    return {
      searchUrl: generateFallbackSearchUrl(recipeData),
      videos: uniqueVideos.slice(0, 3),
    };
  } catch (error) {
    console.error('Error getting optimized YouTube videos:', error);
    return { searchUrl: generateFallbackSearchUrl(recipeData), videos: [] };
  }
}

/**
 * 使用OpenAI分析视频内容，生成更准确的说明
 */
async function generateOptimizedVideoDescription(recipeData, videoDetail, initialDescription) {
  if (!openai) {
    return initialDescription;
  }
  
  try {
    const prompt = `你是一个YouTube视频分析专家。请根据以下信息，生成一个2-3句的中文视频说明。

菜谱信息：
- 标题: ${recipeData.title}
- 食材: ${recipeData.ingredients?.map(ing => ing.name || ing).join(', ') || '未知'}
- 厨具: ${recipeData.cookware || '未知'}

视频信息：
- 标题: ${videoDetail.title}
- 频道: ${videoDetail.channelTitle || '未知'}
- 描述: ${videoDetail.description?.substring(0, 200) || '未知'}

初步说明: ${initialDescription || '无'}

请生成一个2-3句的中文说明，说明这个视频为什么适合这个菜谱，以及视频的主要内容。
说明应该：
1. 解释视频与菜谱的相关性
2. 说明视频的主要内容
3. 使用自然、流畅的中文
4. 长度控制在50-100字之间

只返回说明文本，不要返回其他内容。`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一个YouTube视频分析专家。根据视频信息和菜谱信息，生成准确、有用的视频说明。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    const optimizedDescription = completion.choices[0]?.message?.content?.trim() || initialDescription;
    return optimizedDescription;
  } catch (error) {
    console.error('Error generating optimized video description:', error);
    return initialDescription;
  }
}

/**
 * 方案B：OpenAI直接返回视频ID（不推荐，但可以作为fallback）
 * 
 * 问题：
 * 1. 视频ID可能不存在
 * 2. 无法获取实时视频信息
 * 3. 需要额外的验证步骤
 */
async function getYouTubeVideosFromAI(recipeData) {
  if (!openai) {
    return null;
  }
  
  try {
    const prompt = `你是一个YouTube视频推荐专家。根据以下菜谱信息，推荐3个最相关的YouTube烹饪教程视频。

菜谱信息：
- 标题: ${recipeData.title}
- 描述: ${recipeData.description}
- 食材: ${recipeData.ingredients?.map(ing => ing.name || ing).join(', ') || '未知'}
- 厨具: ${recipeData.cookware || '未知'}

请返回3个YouTube视频的ID和说明。视频ID是YouTube URL中"v="后面的11位字符。

返回JSON格式：
{
  "videos": [
    {
      "videoId": "视频ID",
      "description": "2-3句中文说明，说明视频为什么适合这个菜谱"
    }
  ]
}

注意：
1. 只返回真实存在的视频ID
2. 视频必须与菜谱相关
3. 说明使用中文
4. 返回3个视频`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一个YouTube视频推荐专家。返回真实存在的YouTube视频ID和说明。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });
    
    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    const result = JSON.parse(responseText);
    
    if (result && result.videos && Array.isArray(result.videos)) {
      // 验证视频ID是否存在
      const validatedVideos = await Promise.all(
        result.videos.map(async (video) => {
          const videoDetail = await getYouTubeVideoDetails([video.videoId]);
          if (videoDetail && videoDetail.length > 0) {
            return {
              ...videoDetail[0],
              description: video.description || videoDetail[0].description,
              aiDescription: video.description,
            };
          }
          return null;
        })
      );
      
      return validatedVideos.filter(Boolean);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting YouTube videos from AI:', error);
    return null;
  }
}

/**
 * 辅助函数
 */
function generateFallbackSearchUrl(recipeData) {
  const query = `${recipeData.title} ${recipeData.cookware || ''} recipe`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function removeDuplicateVideos(videos) {
  const uniqueVideos = [];
  const seenVideoIds = new Set();
  
  for (const video of videos) {
    if (video.videoId && !seenVideoIds.has(video.videoId)) {
      seenVideoIds.add(video.videoId);
      uniqueVideos.push(video);
    }
  }
  
  return uniqueVideos;
}

