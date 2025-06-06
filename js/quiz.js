// Quiz engine for educational levels

function loadQuiz(quizPath) {
    const fullPath = `../${quizPath}`; // Adjust path to ensure correct location
    console.log('Fetching quiz from:', fullPath); // Debugging log
    fetch(fullPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Quiz data:', data);
            const quizContainer = document.createElement('div');
            quizContainer.className = 'quiz-container';

            let score = 0;
            const answers = new Set();

            data.quiz.forEach((questionObj, index) => {
                const questionElement = document.createElement('div');
                questionElement.className = 'quiz-question';
                questionElement.innerHTML = `<h3 style="font-weight: bold; font-size: 1.5em;">Q${index + 1}: ${questionObj.question}</h3>`;

                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'quiz-options';

                questionObj.options.forEach(option => {
                    const optionElement = document.createElement('label');
                    optionElement.className = 'quiz-option';
                    optionElement.style = 'display: block; margin: 10px 0; font-size: 1.2em;';
                    optionElement.innerHTML = `
                        <input type="radio" name="question-${index}" value="${option}" style="width: 20px; height: 20px; margin-right: 10px;">
                        ${option}
                    `;
                    optionsContainer.appendChild(optionElement);
                });

                questionElement.appendChild(optionsContainer);
                quizContainer.appendChild(questionElement);
            });

            const submitButton = document.createElement('button');
            submitButton.textContent = 'Submit Quiz';
            submitButton.className = 'quiz-submit';
            submitButton.onclick = () => {
                const selectedOptions = document.querySelectorAll('input[type="radio"]:checked');
                const feedbackContainer = document.createElement('div');
                feedbackContainer.className = 'quiz-feedback';

                // Reset score and answers for each submission
                score = 0;
                const userAnswers = {};
                const missedQuestions = [];

                selectedOptions.forEach(selected => {
                    const questionIndex = parseInt(selected.name.split('-')[1], 10);
                    userAnswers[questionIndex] = selected.value;
                });

                data.quiz.forEach((questionObj, index) => {
                    const feedback = document.createElement('div');
                    feedback.className = 'feedback-item';
                    const correctAnswer = questionObj.answer;
                    const userAnswer = userAnswers[index];

                    if (userAnswer === correctAnswer) {
                        score++;
                        feedback.innerHTML = `<strong>Q${index + 1}:</strong> Correct!`;
                        feedback.style.color = 'green';
                    } else {
                        feedback.innerHTML = `<strong>Q${index + 1}:</strong> Incorrect. The correct answer is <em>${correctAnswer}</em>.`;
                        feedback.style.color = 'red';

                        // Add detailed explanation if available
                        if (questionObj.explanation) {
                            const explanation = document.createElement('div');
                            explanation.className = 'detailed-explanation';
                            explanation.innerHTML = `<strong>Explanation:</strong> ${questionObj.explanation}`;
                            explanation.style.color = 'gray';
                            explanation.style.margin = '10px 0';
                            feedback.appendChild(explanation);

                            // Add additional paragraphs for deeper understanding
                            const additionalInfo1 = document.createElement('p');
                            additionalInfo1.innerHTML = `Understanding this concept is vital because it forms the foundation of how modern systems operate. For example, ${questionObj.explanation} is not just theoretical—it has practical implications in areas like blockchain, where trust and transparency are paramount.`;
                            additionalInfo1.style.color = 'gray';
                            feedback.appendChild(additionalInfo1);

                            const additionalInfo2 = document.createElement('p');
                            additionalInfo2.innerHTML = `Think about this: if ${questionObj.explanation} were misunderstood, it could lead to inefficiencies or even failures in critical systems. This is why mastering such concepts is essential for anyone looking to understand the future of technology and finance.`;
                            additionalInfo2.style.color = 'gray';
                            feedback.appendChild(additionalInfo2);

                            const additionalInfo3 = document.createElement('p');
                            additionalInfo3.innerHTML = `In historical contexts, similar misunderstandings have led to significant challenges. For instance, during the early days of fiat money, a lack of understanding about inflation and trust led to economic collapses. Today, technologies like blockchain aim to solve these issues by providing decentralized and transparent systems.`;
                            additionalInfo3.style.color = 'gray';
                            feedback.appendChild(additionalInfo3);
                        }

                        // Add to missed questions
                        missedQuestions.push(questionObj);
                    }
                    feedbackContainer.appendChild(feedback);
                });

                const rewardMessage = document.createElement('div');
                rewardMessage.className = 'quiz-reward';
                rewardMessage.innerHTML = `<h2 style="font-size: 2em; color: #4CAF50;">🎉 You scored ${score}/${data.quiz.length}! 🎉</h2>
                                       <p>You earned <strong>${score} Stardust tokens</strong>!</p>`;
                feedbackContainer.appendChild(rewardMessage);

                quizContainer.appendChild(feedbackContainer);
                submitButton.disabled = true; // Disable further submissions

                // Auto-scroll to feedback
                feedbackContainer.scrollIntoView({ behavior: 'smooth' });

                // Generate follow-up quiz for missed questions
                if (missedQuestions.length > 0) {
                    const followUpContainer = document.createElement('div');
                    followUpContainer.className = 'follow-up-quiz';
                    followUpContainer.innerHTML = '<h2>Follow-Up Quiz</h2><p>Let’s revisit the questions you missed:</p>';

                    missedQuestions.forEach((missedQuestion, index) => {
                        const questionElement = document.createElement('div');
                        questionElement.className = 'quiz-question';
                        questionElement.innerHTML = `<h3 style="font-weight: bold; font-size: 1.5em;">Q${index + 1}: ${missedQuestion.question}</h3>`;

                        const optionsContainer = document.createElement('div');
                        optionsContainer.className = 'quiz-options';

                        missedQuestion.options.forEach(option => {
                            const optionElement = document.createElement('label');
                            optionElement.className = 'quiz-option';
                            optionElement.style = 'display: block; margin: 10px 0; font-size: 1.2em;';
                            optionElement.innerHTML = `
                                <input type="radio" name="follow-up-question-${index}" value="${option}" style="width: 20px; height: 20px; margin-right: 10px;">
                                ${option}
                            `;
                            optionsContainer.appendChild(optionElement);
                        });

                        questionElement.appendChild(optionsContainer);
                        followUpContainer.appendChild(questionElement);
                    });

                    const followUpSubmitButton = document.createElement('button');
                    followUpSubmitButton.textContent = 'Submit Follow-Up Quiz';
                    followUpSubmitButton.className = 'quiz-submit';
                    followUpSubmitButton.onclick = () => {
                        alert('Follow-up quiz submitted!'); // Placeholder for follow-up quiz logic
                    };

                    followUpContainer.appendChild(followUpSubmitButton);
                    quizContainer.appendChild(followUpContainer);
                }
            };

            quizContainer.appendChild(submitButton);
            document.body.appendChild(quizContainer);

            // Auto-scroll to quiz
            quizContainer.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => console.error('Error loading quiz:', error));
}

function submitQuiz(level, answers) {
    // Logic to evaluate quiz answers
    console.log(`Submitting quiz for level ${level} with answers:`, answers);
}
