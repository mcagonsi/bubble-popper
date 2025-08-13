/**
 * Bubble Popper Game
 * 
 * ============== GAME OVERVIEW ==============
 * A bubble shooting game built with React Native and Expo.
 * 
 * CURRENT IMPLEMENTATION:
 * - Bubble Spawning: Random horizontal positions every 0.5s
 * - Bubble Movement: Upward motion until off-screen
 * - Static Gun: Fixed at bottom center
 * - Basic Laser: Vertical red line appearing for 0.3s on tap
 * - Simple Hit Detection: X-axis distance comparison
 * - Game Flow: Start screen, 120s countdown, score tracking, game over screen
 * 
 * ============== STUDENT ASSIGNMENT ==============
 * Your task is to extend this game by implementing a movable gun that can
 * fire in different directions to make the game more engaging.
 * 
 * ASSESSMENT CRITERIA:
 * 1. Functionality: Gun movement and response to input
 * 2. Code Quality: Structure, comments, efficiency
 * 3. User Experience: Intuitive gameplay, visual appeal
 * 4. Creativity: Unique features beyond requirements
 * 5. Performance: Smooth operation without issues
 * 
 * TIPS:
 * - Use React Native's touch handling for smooth control
 * - Consider Animated API for smoother animations
 * - Clean up any event listeners or timers you add
 * - Test on different device sizes for responsive UI
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableWithoutFeedback, TouchableOpacity} from 'react-native';
import Bubble from './components/Bubble';
import { Image } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function GameScreen() {
  /**
   * Game State
   * 
   * These state variables manage the core game functionality:
   * - gameStarted/gameOver: Control game flow
   * - score/timeLeft: Track player progress
   * - bubbles: Array of bubble objects with positions
   * - laserVisible: Controls when the laser is shown
   */
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [bubbles, setBubbles] = useState([]);
  const [laserVisible, setLaserVisible] = useState(false);
  

  // Fixed gun position - currently in the middle (MODIFY THIS)
  const gunWidth = 100
  const [gunPosition, setGunPosition] = useState(screenWidth / 2 - gunWidth / 2);
  const gunCenterX = gunPosition + gunWidth / 2;
 
  

  
  // Refs for game timers and IDs
  const bubbleIdRef = useRef(1);
  const timerRef = useRef(null);
  const bubbleTimerRef = useRef(null);
  const laserTimeoutRef = useRef(null);
  
  /**
   * Handle tap to shoot laser
   * Currently fires the laser on any tap when game is active
   */
  const moveGunToPosition = (gunCenterX) => {
    if (!gameStarted || gameOver) return;
    
    // const gunCenterX = event.nativeEvent.x;
    const newPosition = Math.max(0, Math.min(gunCenterX - gunWidth/2, screenWidth - gunWidth));
    setGunPosition(newPosition);
    // fireLaser();
  };
  
  /**
   * Fire a laser from the gun center
   * Creates visible laser and checks for bubble hits
   */
  const fireLaser = () => {
    // Clear any existing laser timeout
    if (laserTimeoutRef.current) {
      clearTimeout(laserTimeoutRef.current);
    }
    
    // Make laser visible
    setLaserVisible(true);
    
    
    // Check for hits immediately
    checkHits(gunCenterX);
    
    // Make laser disappear after 300ms
    laserTimeoutRef.current = setTimeout(() => {
      setLaserVisible(false);
    }, 200);
  };
  
  /**
   * Check if laser hits any bubbles
   * @param {number} laserX - X coordinate of the laser
   */
  const checkHits = (laserX) => {
    setBubbles(prevBubbles => {
      const hitBubbleIds = [];
      let hitCount = 0;
      
    
      // Check each bubble for collision
      prevBubbles.forEach(bubble => {
        // Calculate bubble center
        const bubbleCenterX = bubble.x + bubble.radius;
        
        // Check if laser x-coordinate is within bubble's horizontal range
        const distanceX = Math.abs(bubbleCenterX - laserX);
        
        // If laser is within bubble radius, it's a hit
        if (distanceX <= bubble.radius) {
          hitBubbleIds.push(bubble.id);
          hitCount++;
        }
      });
      
      // If any bubbles were hit, update the score
      if (hitCount > 0) {
        setScore(prevScore => prevScore + hitCount);
      }
      
      // Return bubbles that weren't hit
      return prevBubbles.filter(bubble => !hitBubbleIds.includes(bubble.id));
    });
  };
  
  /**
   * Spawn a new bubble with random horizontal position
   * Creates bubble at bottom of screen with random X position
   */
  const spawnBubble = () => {
    const radius = 30;
    // Ensure bubble stays within screen bounds
    const maxX = screenWidth - (radius * 2);
    const newBubble = {
      id: bubbleIdRef.current++,
      x: Math.random() * maxX,
      y: screenHeight - 100, // Start near bottom of screen
      radius: radius,
    };
    
    setBubbles(prev => [...prev, newBubble]);
  };
  
  /**
   * Start the game
   * Initializes game state and starts timers for bubble spawning and countdown
   */
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(120);
    setBubbles([]);
    setLaserVisible(false);
    bubbleIdRef.current = 1;
    
    // Start spawning bubbles every 500ms
    bubbleTimerRef.current = setInterval(spawnBubble, 500);
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Game over
          clearInterval(timerRef.current);
          clearInterval(bubbleTimerRef.current);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  /**
   * Reset game
   * Returns game to initial state and cleans up timers
   */
  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setBubbles([]);
    setScore(0);
    setTimeLeft(120);
    setLaserVisible(false);
    bubbleIdRef.current = 1;
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (bubbleTimerRef.current) clearInterval(bubbleTimerRef.current);
  };
  
  /**
   * Move bubbles upward
   * Uses effect to animate bubbles moving up the screen
   */
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const moveInterval = setInterval(() => {
      setBubbles(prev => {
        const updatedBubbles = prev
          .map(bubble => ({
            ...bubble,
            y: bubble.y - 2, // Move bubbles up
          }))
          .filter(bubble => bubble.y > -60); // Remove bubbles that exit the top
        
        return updatedBubbles;
      });
    }, 16); // ~60 FPS
    
    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver]);
  
  /**
   * Cleanup on unmount
   * Ensures all timers are cleared when component unmounts
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (bubbleTimerRef.current) clearInterval(bubbleTimerRef.current);
      if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
    };
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Game area */}
      <TouchableWithoutFeedback disabled={!gameStarted || gameOver}>
        <View style={styles.gameArea}
          >
          {/* Bubbles */}
          {bubbles.map(bubble => (
            <Bubble
              key={`bubble-${bubble.id}`}
              x={bubble.x}
              y={bubble.y}
              radius={bubble.radius}
            />
          ))}
          
  
          {laserVisible && (
            <View
              style={[
                styles.laser,
                { left: gunCenterX} 
              ]}
            />
          )}
          
          
          {/* Gun - currently static in middle */}
           <TouchableOpacity style={[styles.gun, { left: gunPosition }]}
          onPressIn={(e) => moveGunToPosition(e.nativeEvent.pageX)}
          onPressMove={(e) => moveGunToPosition(e.nativeEvent.pageX)}
          onPressOut={()=>fireLaser()}>
            <Image source ={require('./assets/gun.png')} style={{width: gunWidth, height: 70}}/>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
      


       
      {/* Score and Timer */}
      <View style={styles.hudContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.scoreText}>Time: {timeLeft}s</Text>
      </View>
      
      {/* Start Screen */}
      {!gameStarted && !gameOver && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Bubble Popper</Text>
          <TouchableWithoutFeedback onPress={startGame}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Start Game</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}
      
      {/* Game Over Screen */}
      {gameOver && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Game Over</Text>
          <Text style={styles.scoreText}>Final Score: {score}</Text>
          <TouchableWithoutFeedback onPress={resetGame}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Play Again</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#000033',
  },
  gameArea: {
    width: screenWidth,
    height: screenHeight,
  },
  hudContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 30,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  scoreText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gun: {
    position: 'absolute',
    bottom: 10,
    width: 100,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    
  },
  laser: {
    position: 'absolute',
    top: 0,
    bottom:3,
    width: 4,
    height: '95%',
    backgroundColor: '#ff8000',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 90,
  },

  gunControlArea: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1, // Ensure it's below other elements
  },
});
