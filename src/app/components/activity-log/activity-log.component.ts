import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RoomService } from 'src/app/services/room.service';

@Component({
  selector: 'app-activity-log',
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss'],
})
export class ActivityLogComponent implements OnInit {
  @Input() roomId: string = '';
  activityLogs: any[] = [];

  constructor(private roomService: RoomService) {}

  ngOnInit(): void {
    if (this.roomId) this.getActivityLog(this.roomId);
  }

  getActivityLog(roomId: string): void {
    this.roomService.getActivityLog(roomId).subscribe({
      next: (results) => {
        this.activityLogs = results;
      },
      error: (error) => {
        console.error('Error getting activity logs:', error);
      },
    });
  }

  deleteAllActivityLogs(): void {
    if (this.roomId) {
      this.roomService.deleteAllActivityLogs(this.roomId).subscribe({
        next: () => {
          this.activityLogs = [];
        },
        error: (error) => {
          console.error('Error deleting activity logs:', error);
        },
      });
    }
  }

}

