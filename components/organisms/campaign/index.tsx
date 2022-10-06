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
      <h1>Planetary research for 10 years</h1>
      <AuthorInfo author="Stellar Xam" dateTime="21 hours ago" image={avatar} />
      <Image src={picture} width={642} height={294} alt="project image" />

      <p>
        Project Description Lorem ipsum dolor sit amet, consectetur adipiscing
        elit. Nam dignissim blandit mauris, volutpat eleifend ligula. Etiam
        rhoncus erat ornare mi tincidunt,
        <br />
        <br />
        Project Description Lorem ipsum dolor sit amet, consectetur adipiscing
        elit. Nam dignissim blandit mauris, volutpat eleifend ligula. Etiam
        rhoncus erat ornare mi tincidunt,Project Description Lorem ipsum dolor
        sit amet, consectetur adipiscing elit. Nam dignissim blandit mauris,
        volutpat eleifend ligula. Etiam rhoncus erat ornare mi tincidunt,Project
        Description Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam
        dignissim blandit mauris, volutpat eleifend ligula. Etiam rhoncus erat
        ornare mi tincidunt,
      </p>
    </div>
  )
}
