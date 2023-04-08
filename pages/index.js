import Head from "next/head";
import { useState, useEffect } from "react";
import styles from "./index.module.css";
import prompts from "../prompts";
import toast, { Toaster } from "react-hot-toast";
import ProgressBar from "react-bootstrap/ProgressBar";
import { Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import BounceLoader from "react-spinners/BounceLoader";

import Modal from "react-modal";
import { buttonStyle, customStyles, override } from "./styles";

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [finalCheck, setFinalCheck] = useState("");

  async function onSubmit(event) {
    setLearnLoading(true);
    event.preventDefault();
    setIsOpen(true);
    try {
      const data = await callBE(`Tell me more about ${prompts[currentQuestion].name}`);

      if (!data) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }
      setLearnLoading(false);
      setResult(data.result);
      setUserInput("");
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quesIdx, setQuesIdx] = useState(0);
  const [lock, setLock] = useState(0);
  const [score, setScore] = useState(0);
  const [fetchedQuestions, setFetchedQuestions] = useState([]);
  const [learnLoading, setLearnLoading] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const handlePrevious = () => {
    // const prevQues = currentQuestion - 1;
    // prevQues >= 0 && setCurrentQuestion(prevQues);
    const prevQues = quesIdx - 1;
    prevQues >= 0 && setQuesIdx(prevQues);
  };

  const handleNext = () => {
    // const nextQues = currentQuestion + 1;
    //  nextQues < prompts.length && setCurrentQuestion(nextQues);
    const nextQues = quesIdx + 1;
    nextQues < prompts.length && setQuesIdx(nextQues);
    if (score >= (currentQuestion + 1) * 3 && lock === 0) {
      setLock(currentQuestion + 1);
      toast.success("You have unlocked the next level!");
    } else if (quesIdx + 1 == 3 && score < (currentQuestion + 1) * 3 && lock === 0) {
      toast.error("You have not unlocked the next level yet!");
      setQuesIdx(2);
    }
  };

  const callBE = async (prompt) => {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userInput: prompt,
      }),
    });
    const data = await response.json();
    return data;
  };

  const checkAnswer = async () => {
    setResultLoading(true);
    const data = await callBE(
      `Question is '${fetchedQuestions[quesIdx]}', and answer is '${userInput}', am I correct? Answer in just yes or no`
    );

    // Only first 3 letters of finalCheck
    setFinalCheck(data.result);
    setUserInput("");
    setResultLoading(false);
    if (data.result === "Yes.") {
      toast.success(`You have answered ${quesIdx + 1} / 3 questions correctly!`);
      setScore(score + 1);
      setQuesIdx(quesIdx + 1);
      console.log(score);
      if (score >= (currentQuestion + 1) * 3 - 1) {
        toast.success("You have unlocked the next level!");
        setCurrentQuestion(currentQuestion + 1);
        setQuesIdx(0);
      }
    } else {
      toast.error(
        "Incorrect answer! Please learn more about the topic by clicking on the button and try again!"
      );
    }
  };

  const getQuestions = async () => {
    const data = await callBE(
      `Give me 3 questions regarding '${prompts[currentQuestion].prompt}', sepearated by a line, dont give the answers.`
    );
    // data has 3 questions and 3 answers, each seperated by a tilde, extract questions in one array and answers in another.
    // Map through data, and for each element, split by tilde, and push to questions array and the remaining to answers array.
    const questions = data.result.split("\n");
    // remove any empty strings in questions array
    const filteredQuestions = questions.filter((question) => question !== "");
    setFetchedQuestions(filteredQuestions);
    setQuestionsLoading(false);
  };

  // Whenever current question changes, call the api in generate.js
  // and set the result to the result of the api call.
  useEffect(() => {
    setQuestionsLoading(true);
    getQuestions();
  }, [currentQuestion]);

  return (
    <div>
      <Head>
        <title>Convai Challenge</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"></link>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""></link>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,500;1,300;1,400&display=swap"
          rel="stylesheet"
        ></link>
      </Head>
      <main className={styles.main}>
        <Toaster />
        <Row style={{ width: "100%", marginBottom: "5px", marginTop: "-10px" }}>
          <Col>
            <ProgressBar striped variant="info" now={(currentQuestion / 5) * 100} />
          </Col>
        </Row>
        <Row style={{ width: "80%" }}>
          <Col>
            <ProgressBar striped variant="info" now={(quesIdx / 3) * 100} />
          </Col>
        </Row>
        <h3>{prompts[currentQuestion].name}</h3>
        {questionsLoading ? (
          <BounceLoader color="#36d7b7" cssOverride={override} size={30} />
        ) : (
          <h4>{fetchedQuestions[quesIdx]}</h4>
        )}
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="userUnput"
            placeholder="Intro to ML"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
          <input type="submit" value="Learn about this topic." />
        </form>
        <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} style={customStyles}>
          <h1>Modal Content</h1>
          {learnLoading ? (
            <div>
              <BounceLoader color="#36d7b7" cssOverride={override} size={30} />
              <h6>OpenAI ChatGPT API is slow, please wait a few seconds.</h6>
            </div>
          ) : (
            <p className={styles.result}>{result}</p>
          )}
          <button onClick={() => setIsOpen(false)} style={buttonStyle}>
            Close Modal
          </button>
        </Modal>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <button style={buttonStyle} onClick={handlePrevious}>
            Previous
          </button>
          <button style={buttonStyle} onClick={handleNext}>
            Next
          </button>
        </div>
        <button style={buttonStyle} onClick={checkAnswer}>
          Answer!
        </button>
        {resultLoading ? (
          <BounceLoader color="#36d7b7" cssOverride={override} size={30} />
        ) : (
          <div className={styles.result}>{finalCheck}</div>
        )}
      </main>
    </div>
  );
}
