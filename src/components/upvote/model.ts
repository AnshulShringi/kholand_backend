import {Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn} from "typeorm";
import { recoverPersonalSignature } from 'eth-sig-util';
import { bufferToHex } from 'ethereumjs-util';
import jwt from 'jsonwebtoken';

import { config } from '../../config';
import {AmountPerPlayer, LandOwnership} from "../transactions/model";

@Entity("upvote")
export class Upvote extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number; // Note that the `null assertion` `!` is required in strict mode.

	@Column("int", { 
		nullable: false ,
		default: 0
	})
	count: number = 0;

	@Column("varchar", {
		unique: true,
		length: 120,
		nullable: false 
	})
	game!: string;

	@CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

	static registerUpvote = async (gameIdentifier: string) => {
		let upvoteObject = await Upvote.findOne({game: gameIdentifier})
		if(upvoteObject == undefined){
			upvoteObject = Upvote.create({
				game: gameIdentifier,
				count: 0
			})
		}
		upvoteObject.count = upvoteObject.count + 1
		await upvoteObject.save()
	}
}
