import React from 'react'
import styles from './style.module.css'
import Image from 'next/image'
import picture from '../../../assets/example.png'
import { AuthorInfo } from '../../atoms'
import avatar from '../../../assets/avatar.png'

export function Campaign() {
  return (
    <div className={styles.content}>
      <h6>Starfund #821</h6>
      <h1>Planetary open-source photography</h1>
      <AuthorInfo author="Sam Stroop" dateTime="21 hours ago" image={avatar} />
      <Image src={picture} width={642} height={294} alt="project image" />
      <p>
        Hello! My name is Sam and I’m working with a team of three other
        passionate individuals to take photos of the planets in our solar system
        and make them open-source to the world! We are fascinated by the stars
        and the system and we think images of these entities should be shared
        with everyone.
      </p>
      <p>
        Our hope is that by making these open-source, people will be able to use
        them for personal, educational, and even commercial purposes. We are
        raising funds to help cover the cost of equipment and time spent on this
        project. Any amount helps and we are grateful for your support!
      </p>
    </div>
  )
}
